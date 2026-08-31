"""The mail diagnostic command.

The point of the command is that a broken relay produces a sentence someone
can act on rather than a traceback, so most of what is worth testing here is
which sentence each failure produces.
"""

import smtplib
import socket
from io import StringIO
from unittest.mock import patch

import pytest
from django.core import mail
from django.core.management import call_command
from django.core.management.base import CommandError

SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


def run(**options):
    out = StringIO()
    call_command("check_email", stdout=out, stderr=out, **options)
    return out.getvalue()


class TestReport:
    def test_it_reports_the_configured_settings(self, settings):
        settings.EMAIL_HOST = "smtp-relay.example.com"
        settings.EMAIL_PORT = 587

        output = run()

        assert "smtp-relay.example.com" in output
        assert "587" in output

    def test_it_never_prints_the_password(self, settings):
        """This output gets pasted into chat logs and issue threads."""
        settings.EMAIL_HOST_PASSWORD = "sooper-secret-smtp-key"

        output = run()

        assert "sooper-secret-smtp-key" not in output
        assert "set" in output

    def test_an_unset_password_is_reported_as_missing(self, settings):
        settings.EMAIL_HOST_PASSWORD = ""

        assert "(unset)" in run()

    def test_it_warns_when_the_backend_does_not_send(self, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

        assert "not an SMTP backend" in run()

    def test_no_warning_for_a_real_smtp_backend(self, settings):
        settings.EMAIL_BACKEND = SMTP_BACKEND

        with patch("django.core.mail.backends.smtp.EmailBackend.open"):
            assert "not an SMTP backend" not in run()


class TestSending:
    def test_nothing_is_sent_without_a_recipient(self):
        output = run()

        assert mail.outbox == []
        assert "Nothing sent" in output

    def test_it_sends_to_the_given_recipient(self):
        run(to="ada@example.com")

        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ["ada@example.com"]

    def test_it_sends_from_the_configured_sender(self, settings):
        """--to proves the real DEFAULT_FROM_EMAIL works, not a stand-in."""
        settings.DEFAULT_FROM_EMAIL = "ORIYONI <no-reply@oriyoni.shop>"

        run(to="ada@example.com")

        assert mail.outbox[0].from_email == "ORIYONI <no-reply@oriyoni.shop>"


class TestFailures:
    """Each of these is a different fix, so each gets its own message."""

    @pytest.fixture(autouse=True)
    def _smtp(self, settings):
        settings.EMAIL_BACKEND = SMTP_BACKEND
        settings.EMAIL_HOST = "smtp-relay.example.com"

    def _open_raises(self, exc):
        return patch("django.core.mail.backends.smtp.EmailBackend.open", side_effect=exc)

    def test_a_bad_key_is_reported_as_an_auth_problem(self):
        with self._open_raises(smtplib.SMTPAuthenticationError(535, b"bad login")):
            with pytest.raises(CommandError) as caught:
                run()

        assert "Authentication rejected" in str(caught.value)

    def test_an_unreachable_host_is_not_reported_as_an_auth_problem(self):
        with self._open_raises(socket.gaierror("nodename nor servname provided")):
            with pytest.raises(CommandError) as caught:
                run()

        message = str(caught.value)
        assert "Could not reach the server" in message
        assert "smtp-relay.example.com" in message
        assert "Authentication" not in message

    def test_a_blocked_port_names_the_port(self):
        with self._open_raises(ConnectionRefusedError("connection refused")):
            with pytest.raises(CommandError) as caught:
                run()

        assert "587" in str(caught.value)

    def test_a_tls_mismatch_mentions_the_tls_settings(self):
        with self._open_raises(smtplib.SMTPNotSupportedError("STARTTLS not supported")):
            with pytest.raises(CommandError) as caught:
                run()

        assert "EMAIL_USE_TLS" in str(caught.value)

    def test_an_unverified_sender_is_distinguished_from_a_login_problem(self):
        """The most confusing failure: the login worked, the domain did not."""
        refused = smtplib.SMTPSenderRefused(553, b"sender not verified", "no-reply@oriyoni.shop")

        with patch("django.core.mail.backends.smtp.EmailBackend.open"):
            with patch(
                "django.core.mail.backends.smtp.EmailBackend.send_messages", side_effect=refused
            ):
                with pytest.raises(CommandError) as caught:
                    run(to="ada@example.com")

        message = str(caught.value)
        assert "refused" in message and "sender" in message
        assert "not verified" in message or "not a confirmed sender" in message
