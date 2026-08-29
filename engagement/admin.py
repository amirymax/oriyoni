from django.contrib import admin

from engagement.models import ContactMessage, NewsletterSubscriber


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "language", "is_active", "created_at", "unsubscribed_at"]
    list_filter = ["is_active", "language", "created_at"]
    search_fields = ["email"]
    readonly_fields = ["unsubscribe_token", "unsubscribed_at", "created_at", "updated_at"]
    actions = ["export_active_addresses"]

    @admin.action(description="Export selected active addresses as text")
    def export_active_addresses(self, request, queryset):
        from django.http import HttpResponse

        addresses = queryset.filter(is_active=True).values_list("email", flat=True)
        return HttpResponse("\n".join(addresses), content_type="text/plain")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "subject", "language", "is_handled", "created_at"]
    list_filter = ["is_handled", "language", "created_at"]
    search_fields = ["name", "email", "subject", "message"]
    list_editable = ["is_handled"]
    date_hierarchy = "created_at"
    # What a visitor wrote is a record, not a draft to edit.
    readonly_fields = ["name", "email", "subject", "message", "language", "created_at"]

    fieldsets = [
        (None, {"fields": ["name", "email", "subject", "language", "created_at"]}),
        ("Message", {"fields": ["message"]}),
        ("Handling", {"fields": ["is_handled"]}),
    ]

    def has_add_permission(self, request):
        return False
