"""A single error shape for the whole API.

DRF returns field errors as a bare mapping and everything else as
{"detail": …}, so a client has to sniff which it got. Normalising both into
{"detail": …, "errors": {…}} lets the storefront render a message and
highlight fields with one code path.
"""

from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        # Not an APIException — let Django's handler turn it into a 500 so the
        # traceback is still logged rather than swallowed into a tidy body.
        return None

    data = response.data

    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        response.data = {"detail": str(data["detail"]), "errors": {}}
        return response

    if isinstance(data, dict):
        errors = {field: _messages(value) for field, value in data.items()}
        response.data = {"detail": "The submitted data was not valid.", "errors": errors}
        return response

    # A list at the top level: serializer non_field_errors, or many=True input.
    response.data = {
        "detail": "The submitted data was not valid.",
        "errors": {"non_field_errors": _messages(data)},
    }
    return response


def _messages(value):
    if isinstance(value, list):
        return [str(item) for item in value]
    return [str(value)]
