"use strict";
const contactModal = new bootstrap.Modal(document.getElementById("contactModal"));
// Safely encode user-supplied strings before inserting into the DOM
function escapeHtml(text) {
    return $("<div>").text(text || "").html();
}
function getInitials(name) {
    return name.trim().split(" ")
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join("");
}
function getAvatarColor(name) {
    const colors = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
    return colors[name.charCodeAt(0) % colors.length];
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
function updateDeleteSelectedButton() {
    const checkedCount = $(".row-checkbox:checked").length;
    checkedCount > 0
        ? $("#btnDeleteSelected").removeClass("d-none")
        : $("#btnDeleteSelected").addClass("d-none");
}
function renderContacts(contacts) {
    updateCount(contacts.length);
    $("#selectAll").prop("checked", false);
    $("#btnDeleteSelected").addClass("d-none");
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
                    <input type="checkbox" class="form-check-input row-checkbox" data-id="${c.id}" />
                </td>
                <td>
                    <div class="cm-avatar" style="background:${color}">${initials}</div>
                </td>
                <td class="fw-medium">${escapeHtml(c.name)}</td>
                <td class="text-muted">${escapeHtml(c.email)}</td>
                <td class="text-muted">${escapeHtml(c.phone)}</td>
                <td>
                    <button class="btn btn-sm cm-btn-edit btn-edit"
                        data-id="${c.id}"
                        data-name="${escapeHtml(c.name)}"
                        data-email="${escapeHtml(c.email)}"
                        data-phone="${escapeHtml((_a = c.phone) !== null && _a !== void 0 ? _a : "")}">Edit</button>
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
        var _a, _b, _c;
        if (xhr.status === 409) {
            $("#contactEmail").addClass("is-invalid");
            $("#emailError").text((_b = (_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) !== null && _b !== void 0 ? _b : "That email is already in use.");
        }
        else {
            const errors = (_c = xhr.responseJSON) === null || _c === void 0 ? void 0 : _c.errors;
            const msg = errors
                ? Object.values(errors).flat().join(" ")
                : "Something went wrong. Please try again.";
            showAlert(msg, "danger");
        }
    });
}
function deleteSelected() {
    const ids = [];
    $(".row-checkbox:checked").each(function () {
        ids.push($(this).data("id"));
    });
    if (ids.length === 0)
        return;
    const label = ids.length === 1 ? "1 contact" : `${ids.length} contacts`;
    if (!confirm(`Delete ${label}?`))
        return;
    const requests = ids.map(id => $.ajax({ url: `/Contact/Delete/${id}`, method: "DELETE" }));
    $.when(...requests)
        .done(() => {
        loadContacts();
        showAlert(`${label} deleted.`, "success");
    })
        .fail(() => showAlert("Some contacts could not be deleted.", "danger"));
}
$(document).ready(function () {
    loadContacts();
    let searchTimer; // 300ms debounce
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
    $("#btnDeleteSelected").on("click", deleteSelected);
    $("#selectAll").on("change", function () {
        $(".row-checkbox").prop("checked", $(this).is(":checked"));
        updateDeleteSelectedButton();
    });
    $(document).on("change", ".row-checkbox", function () {
        const total = $(".row-checkbox").length;
        const checked = $(".row-checkbox:checked").length;
        $("#selectAll").prop("checked", total === checked);
        updateDeleteSelectedButton();
    });
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
    $("#contactModal").on("keydown", "input", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            saveContact();
        }
    });
});
//# sourceMappingURL=contacts.js.map