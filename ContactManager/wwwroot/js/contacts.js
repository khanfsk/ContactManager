"use strict";
const contactModal = new bootstrap.Modal(document.getElementById("contactModal"));
function escapeHtml(text) {
    return $("<div>").text(text || "").html();
}
function showAlert(message, type) {
    const html = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    $("#alertContainer").html(html);
    setTimeout(() => {
        const alertEl = document.querySelector("#alertContainer .alert");
        if (alertEl)
            bootstrap.Alert.getOrCreateInstance(alertEl).close();
    }, 4000);
}
function renderContacts(contacts) {
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
function loadContacts() {
    $.get("/Contact/GetAll")
        .done((data) => renderContacts(data))
        .fail(() => showAlert("Could not load contacts.", "danger"));
}
function clearErrors() {
    $("#contactName, #contactEmail").removeClass("is-invalid");
    $("#nameError, #emailError").text("");
}
function openModal(contact) {
    var _a, _b, _c, _d;
    const isEdit = !!contact;
    $("#contactModalLabel").text(isEdit ? "Edit Contact" : "Add Contact");
    $("#contactId").val((_a = contact === null || contact === void 0 ? void 0 : contact.id) !== null && _a !== void 0 ? _a : "");
    $("#contactName").val((_b = contact === null || contact === void 0 ? void 0 : contact.name) !== null && _b !== void 0 ? _b : "");
    $("#contactEmail").val((_c = contact === null || contact === void 0 ? void 0 : contact.email) !== null && _c !== void 0 ? _c : "");
    $("#contactPhone").val((_d = contact === null || contact === void 0 ? void 0 : contact.phone) !== null && _d !== void 0 ? _d : "");
    clearErrors();
    contactModal.show();
}
function validateForm() {
    let valid = true;
    clearErrors();
    const name = $("#contactName").val().trim();
    const email = $("#contactEmail").val().trim();
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
    }
    else if (!emailRegex.test(email)) {
        $("#contactEmail").addClass("is-invalid");
        $("#emailError").text("Please enter a valid email.");
        valid = false;
    }
    return valid;
}
function saveContact() {
    if (!validateForm())
        return;
    const id = $("#contactId").val();
    const contact = {
        name: $("#contactName").val().trim(),
        email: $("#contactEmail").val().trim(),
        phone: $("#contactPhone").val().trim()
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
        .fail((xhr) => {
        var _a;
        const errors = (_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.errors;
        const msg = errors
            ? Object.values(errors).flat().join(" ")
            : "Something went wrong. Please try again.";
        showAlert(msg, "danger");
    });
}
$(document).ready(function () {
    loadContacts();
    let searchTimer;
    $("#searchInput").on("input", function () {
        clearTimeout(searchTimer);
        const query = $(this).val().trim();
        searchTimer = setTimeout(() => {
            query
                ? $.get("/Contact/Search", { query }).done((data) => renderContacts(data))
                : loadContacts();
        }, 300);
    });
    $("#btnAddContact").on("click", () => openModal());
    $("#btnSave").on("click", saveContact);
    $(document).on("click", ".btn-edit", function () {
        const contact = {
            id: $(this).data("id"),
            name: $(this).data("name"),
            email: $(this).data("email"),
            phone: $(this).data("phone")
        };
        openModal(contact);
    });
    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id");
        if (!confirm("Delete this contact?"))
            return;
        $.ajax({ url: `/Contact/Delete/${id}`, method: "DELETE" })
            .done(() => {
            $(`tr[data-id="${id}"]`).fadeOut(300, function () { $(this).remove(); });
            showAlert("Contact deleted.", "success");
        })
            .fail(() => showAlert("Could not delete contact.", "danger"));
    });
    $("#contactForm").on("keydown", function (e) {
        if (e.key === "Enter")
            saveContact();
    });
});
//# sourceMappingURL=contacts.js.map