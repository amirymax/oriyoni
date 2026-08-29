import django.dispatch

# Sent when a request signs someone in — registration, login, or completing a
# password reset. Kwargs: request, user.
#
# Django's own user_logged_in is deliberately not reused: it is fired by
# django.contrib.auth.login(), which these views do not call, and it already
# carries receivers (last_login among them) that assume a session backend.
user_signed_in = django.dispatch.Signal()
