"""Signed, single-use tokens for confirming an email address.

Django's default_token_generator is built for password resets: it folds
last_login into its hash, so a link is spent the moment its owner signs in
anywhere. That is right for a reset — the link is meant to be short-lived and
immediately consumed — and wrong here, where the link sits unread in an inbox
while the shopper carries on browsing. Signing in on a phone must not quietly
kill the confirmation email waiting on a laptop.
"""

from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.crypto import constant_time_compare
from django.utils.http import base36_to_int


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    # A salt of its own, so a reset token cannot be presented here as a
    # verification token or the other way round.
    key_salt = "accounts.tokens.EmailVerificationTokenGenerator"

    def _make_hash_value(self, user, timestamp):
        """Hash the state this token vouches for, and nothing else.

        email_verified_at changes the instant the link is redeemed, which is
        what makes it single-use; the address is in here so that a token stops
        working if the account it was issued for ever changes hands.
        """
        return f"{user.pk}{user.email}{user.email_verified_at}{timestamp}"

    def check_token(self, user, token):
        """As the parent, but aged against EMAIL_VERIFICATION_TIMEOUT.

        Reimplemented rather than delegated because the parent reads
        settings.PASSWORD_RESET_TIMEOUT directly, and the two want different
        budgets: a reset link should expire in hours, a confirmation link has
        to survive a night in an inbox. Overriding the setting around a super()
        call would work in a single thread and race in a real one.
        """
        if not (user and token):
            return False

        try:
            ts_b36, _ = token.split("-")
            timestamp = base36_to_int(ts_b36)
        except ValueError:
            return False

        for secret in [self.secret, *self.secret_fallbacks]:
            if constant_time_compare(
                self._make_token_with_timestamp(user, timestamp, secret), token
            ):
                break
        else:
            return False

        # The HMAC above already covers the timestamp, so it cannot have been
        # moved forward to buy more time; only its age is left to check.
        age = self._num_seconds(self._now()) - timestamp
        return age <= settings.EMAIL_VERIFICATION_TIMEOUT


email_verification_token_generator = EmailVerificationTokenGenerator()
