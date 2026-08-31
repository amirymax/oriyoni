"""Prove the configured mail settings actually work.

Django's own failure modes here are unhelpful: a wrong SMTP key, a firewalled
port and an unverified sender all surface as a raw smtplib traceback, and the
three want completely different fixes. This command names which one happened.
"""

import smtplib
import socket
import ssl

from django.conf import settings
from django.core.mail import get_connection, send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Report the configured email settings, open a connection, and "
        "optionally send a test message."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            help=(
                "Address to send a test message to. Without it the connection "
                "is checked but nothing is sent."
            ),
        )

    def handle(self, *args, **options):
        self._report()

        # Deliberately not skipped for the console backend: opening and sending
        # are no-ops there, and running them anyway proves the command itself
        # works before anyone points it at a real relay.
        is_smtp = "smtp" in settings.EMAIL_BACKEND
        if not is_smtp:
            self.stdout.write(
                self.style.WARNING(
                    "\nThis is not an SMTP backend — nothing will leave this machine.\n"
                    "Set EMAIL_BACKEND to django.core.mail.backends.smtp.EmailBackend "
                    "to test a real send."
                )
            )

        self._open(is_smtp)

        recipient = options["to"]
        if not recipient:
            self.stdout.write("\nNothing sent. Pass --to you@example.com to send a test message.")
            return

        self._send(recipient, is_smtp)

    def _report(self):
        # The password is never printed, only its presence. This output ends up
        # pasted into chat logs and issue threads.
        rows = [
            ("Backend", settings.EMAIL_BACKEND),
            ("Host", settings.EMAIL_HOST or "(unset)"),
            ("Port", settings.EMAIL_PORT),
            ("User", settings.EMAIL_HOST_USER or "(unset)"),
            ("Password", "set" if settings.EMAIL_HOST_PASSWORD else "(unset)"),
            ("TLS", settings.EMAIL_USE_TLS),
            ("From", settings.DEFAULT_FROM_EMAIL),
        ]
        for label, value in rows:
            self.stdout.write(f"{label:9}: {value}")

    def _open(self, is_smtp):
        connection = get_connection()

        try:
            connection.open()
        except smtplib.SMTPAuthenticationError as exc:
            raise CommandError(
                f"Authentication rejected ({exc.smtp_code}).\n"
                "The server is reachable, so the host and port are right and this "
                "is the login or the key.\n"
                "Providers usually issue a dedicated SMTP login and key that are "
                "not your account email and password — check you copied those."
            ) from exc
        except smtplib.SMTPNotSupportedError as exc:
            raise CommandError(
                f"The server refused the connection options: {exc}\n"
                "Usually EMAIL_USE_TLS against a port that does not speak STARTTLS. "
                "Port 587 wants EMAIL_USE_TLS=True; port 465 needs EMAIL_USE_SSL, "
                "which this project does not expose."
            ) from exc
        except ssl.SSLError as exc:
            raise CommandError(
                f"TLS negotiation failed: {exc}\nCheck EMAIL_PORT and EMAIL_USE_TLS agree."
            ) from exc
        except (socket.gaierror, OSError) as exc:
            # OSError covers ConnectionRefused and the rest of the socket family,
            # so it has to come after the SSL and SMTP cases above.
            raise CommandError(
                f"Could not reach the server: {exc}\n"
                f"Check EMAIL_HOST ({settings.EMAIL_HOST or 'unset'}) for typos. If it "
                f"is right, something is blocking outbound port {settings.EMAIL_PORT} — "
                "many hosts do by default."
            ) from exc

        connection.close()
        # Opening a console or locmem backend touches no network, so claiming a
        # login succeeded would be telling someone their credentials work when
        # nothing has checked them.
        self.stdout.write(
            self.style.SUCCESS("\nConnection and login OK.")
            if is_smtp
            else "\nBackend opened. No server was contacted."
        )

    def _send(self, recipient, is_smtp):
        try:
            # from_email=None makes Django fall back to DEFAULT_FROM_EMAIL, so
            # this exercises the sender the storefront will really use.
            send_mail(
                subject="ORIYONI SMTP test",
                message="If you are reading this, the mail settings work.",
                from_email=None,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except smtplib.SMTPSenderRefused as exc:
            raise CommandError(
                f"The server refused {settings.DEFAULT_FROM_EMAIL} as the sender "
                f"({exc.smtp_code}).\n"
                "The relay will not send as that address yet: either its domain is "
                "not verified, or that exact address is not a confirmed sender."
            ) from exc
        except smtplib.SMTPRecipientsRefused as exc:
            raise CommandError(f"The server refused the recipient: {exc.recipients}") from exc
        except smtplib.SMTPException as exc:
            raise CommandError(f"The server rejected the message: {exc}") from exc

        self.stdout.write(
            self.style.SUCCESS(f"Sent to {recipient}. Check the inbox, and the spam folder.")
            if is_smtp
            else f"Handed to the backend for {recipient}. Nothing was actually delivered."
        )
