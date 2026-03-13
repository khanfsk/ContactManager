interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
}

const contactModal = new bootstrap.Modal(document.getElementById("contactModal")!);

function escapeHtml(text: string): string {
    return $("<div>").text(text || "").html();
}

function showAlert(message: string, type: "success" | "danger"): void {
    const html = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    $("#alertContainer").html(html);
    setTimeout(() => {
        const alertEl = document.querySelector("#alertContainer .alert");
        if (alertEl) bootstrap.Alert.getOrCreateInstance(alertEl).close();
    }, 4000);
}

function renderContacts(contacts: Contact[]): void {
    const tbody = $("#contactsBody");
    tbody.empty();

    if (!contacts || contacts.length === 0) {
        tbody.append('<tr><td colspan="4" class="text-center text-muted">No contacts found.</td></tr>');
        return;
    }

    contacts.forEach(c => {
        tbody.append(`
            <tr data-id="${c.id}">
                <td>${escapeHtml(c.name)}</td>
                <td>${escapeHtml(c.email)}</td>
                <td>${escapeHtml(c.phone)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning btn-edit me-1"
                        data-id="${c.id}"
                        data-name="${escapeHtml(c.name)}"
                        data-email="${escapeHtml(c.email)}"
                        data-phone="${escapeHtml(c.phone)}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${c.id}">Delete</button>
                </td>
            </tr>
        `);
    });
}

function loadContacts(): void {
    $.get("/Contact/GetAll")
        .done((data: Contact[]) => renderContacts(data))
        .fail(() => showAlert("Could not load contacts.", "danger"));
}

function clearErrors(): void {
    $("#contactName, #contactEmail").removeClass("is-invalid");
    $("#nameError, #emailError").text("");
}

function openModal(contact?: Contact): void {
    const isEdit = !!contact;
    $("#contactModalLabel").text(isEdit ? "Edit Contact" : "Add Contact");
    $("#contactId").val(contact?.id ?? "");
    $("#contactName").val(contact?.name ?? "");
    $("#contactEmail").val(contact?.email ?? "");
    $("#contactPhone").val(contact?.phone ?? "");
    clearErrors();
    contactModal.show();
}

function validateForm(): boolean {
    let valid = true;
    clearErrors();

    const name = ($("#contactName").val() as string).trim();
    const email = ($("#contactEmail").val() as string).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
        $("#contactName").addClass("is-invalid");
        $("#nameError").text("Name is required.");
        valid = false;
    }

    if (!email) {
        $("#contactEmail").addClass("is-invalid");
        $("#emailError").text("Email is required.");
        valid = false;
    } else if (!emailRegex.test(email)) {
        $("#contactEmail").addClass("is-invalid");
        $("#emailError").text("Please enter a valid email.");
        valid = false;
    }

    return valid;
}

function saveContact(): void {
    if (!validateForm()) return;

    const id = $("#contactId").val() as string;
    const contact = {
        name: ($("#contactName").val() as string).trim(),
        email: ($("#contactEmail").val() as string).trim(),
        phone: ($("#contactPhone").val() as string).trim()
    };

    const isEdit = id !== "";
    const url = isEdit ? `/Contact/Update/${id}` : "/Contact/Create";
    const method = isEdit ? "PUT" : "POST";

    $.ajax({ url, method, contentType: "application/json", data: JSON.stringify(contact) })
        .done(() => {
            contactModal.hide();
            loadContacts();
            showAlert(`Contact ${isEdit ? "updated" : "added"} successfully.`, "success");
        })
        .fail((xhr: JQuery.jqXHR) => {
            const errors = xhr.responseJSON?.errors;
            const msg = errors
                ? Object.values(errors).flat().join(" ")
                : "Something went wrong. Please try again.";
            showAlert(msg as string, "danger");
        });
}

$(document).ready(function () {
    loadContacts();

    let searchTimer: ReturnType<typeof setTimeout>;

    $("#searchInput").on("input", function () {
        clearTimeout(searchTimer);
        const query = ($(this).val() as string).trim();
        searchTimer = setTimeout(() => {
            query
                ? $.get("/Contact/Search", { query }).done((data: Contact[]) => renderContacts(data))
                : loadContacts();
        }, 300);
    });

    $("#btnAddContact").on("click", () => openModal());
    $("#btnSave").on("click", saveContact);

    $(document).on("click", ".btn-edit", function () {
        const contact: Contact = {
            id: $(this).data("id"),
            name: $(this).data("name"),
            email: $(this).data("email"),
            phone: $(this).data("phone")
        };
        openModal(contact);
    });

    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id") as string;
        if (!confirm("Delete this contact?")) return;

        $.ajax({ url: `/Contact/Delete/${id}`, method: "DELETE" })
            .done(() => {
                $(`tr[data-id="${id}"]`).fadeOut(300, function () { $(this).remove(); });
                showAlert("Contact deleted.", "success");
            })
            .fail(() => showAlert("Could not delete contact.", "danger"));
    });

    $("#contactForm").on("keydown", function (e) {
        if (e.key === "Enter") saveContact();
    });
});
