from django.contrib.auth.backends import ModelBackend

from accounts.models import User


class EmailBackend(ModelBackend):
    """Authenticates against the stored, lowercased email address.

    Addresses are normalized on save, so the plain ModelBackend — which looks
    the username up verbatim — would turn away someone typing the same address
    with different capitalisation. Normalizing the lookup the same way the
    column is written makes login case-insensitive.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if username is not None:
            username = User.objects.normalize_email(username.strip())

        # Deliberately delegated: the parent still runs the password hasher
        # for unknown addresses, so a missing account and a wrong password
        # take the same time to answer.
        return super().authenticate(request, username=username, password=password, **kwargs)
