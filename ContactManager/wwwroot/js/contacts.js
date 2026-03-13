"use strict";
const contactModal = new bootstrap.Modal(document.getElementById("contactModal"));
function escapeHtml(text) {
    return $("<div>").text(text || "").html();
}
function getInitials(name) {
    return name.trim().split(" ")
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join("");
}
// cycles through a few colors based on the first char so each contact feels distinct
function getAvatarColor(name) {
    const colors = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
function updateCount(n) {
    $("#contactCount").text(`${n} ${n === 1 ? "contact" : "contacts"}`);
}
function showTable() {
    $("#loadingState").addClass("d-none");
    $("#emptyState").addClass("d-none");
    $("#contactsTable").removeClass("d-none");
}
function showEmpty() {
    $("#loadingState").addClass("d-none");
    $("#contactsTable").addClass("d-none");
    $("#emptyState").removeClass("d-none");
}
function renderContacts(contacts) {
    updateCount(contacts.length);
    if (!contacts || contacts.length === 0) {
        showEmpty();
        return;
    }
    showTable();
    const tbody = $("#contactsBody");
    tbody.empty();
    contacts.forEach(c => {
        var _a;
        const initials = getInitials(c.name);
        const color = getAvatarColor(c.name);
        tbody.append(`
            <tr data-id="${c.id}">
                <td>
                    <div class="cm-avatar" style="background:${color}">${initials}</div>
                </td>
                <td class="fw-medium">${escapeHtml(c.name)}</td>
                <td class="text-muted">${escapeHtml(c.email)}</td>
                <td class="text-muted">${escapeHtml(c.phone)}</td>
                <td>
                    <button class="btn btn-sm cm-btn-edit btn-edit me-1"
                        data-id="${c.id}"
                        data-name="${escapeHtml(c.name)}"
                        data-email="${escapeHtml(c.email)}"
                        data-phone="${escapeHtml((_a = c.phone) !== null && _a !== void 0 ? _a : "")}">Edit</button>
                    <button class="btn btn-sm cm-btn-delete btn-delete" data-id="${c.id}">Delete</button>
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
        var _a;
        const contact = {
            id: $(this).data("id"),
            name: $(this).data("name"),
            email: $(this).data("email"),
            phone: (_a = $(this).data("phone")) !== null && _a !== void 0 ? _a : ""
        };
        openModal(contact);
    });
    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id");
        if (!confirm("Delete this contact?"))
            return;
        $.ajax({ url: `/Contact/Delete/${id}`, method: "DELETE" })
            .done(() => {
            $(`tr[data-id="${id}"]`).fadeOut(300, function () {
                $(this).remove();
                if ($("#contactsBody tr").length === 0)
                    showEmpty();
                updateCount(parseInt($("#contactCount").text()) - 1);
            });
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