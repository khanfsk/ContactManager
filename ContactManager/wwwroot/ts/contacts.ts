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

function getInitials(name: string): string {
    return name.trim().split(" ")
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join("");
}

// cycles through a few colors based on the first char so each contact feels distinct
function getAvatarColor(name: string): string {
    const colors = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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

function updateCount(n: number): void {
    $("#contactCount").text(`${n} ${n === 1 ? "contact" : "contacts"}`);
}

function showTable(): void {
    $("#loadingState").addClass("d-none");
    $("#emptyState").addClass("d-none");
    $("#contactsTable").removeClass("d-none");
}

function showEmpty(): void {
    $("#loadingState").addClass("d-none");
    $("#contactsTable").addClass("d-none");
    $("#emptyState").removeClass("d-none");
}

function renderContacts(contacts: Contact[]): void {
    updateCount(contacts.length);

    if (!contacts || contacts.length === 0) {
        showEmpty();
        return;
    }

    showTable();
    const tbody = $("#contactsBody");
    tbody.empty();

    contacts.forEach(c => {
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
                        data-phone="${escapeHtml(c.phone ?? "")}">Edit</button>
                    <button class="btn btn-sm cm-btn-delete btn-delete" data-id="${c.id}">Delete</button>
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
            phone: $(this).data("phone") ?? ""
        };
        openModal(contact);
    });

    $(document).on("click", ".btn-delete", function () {
        const id = $(this).data("id") as string;
        if (!confirm("Delete this contact?")) return;

        $.ajax({ url: `/Contact/Delete/${id}`, method: "DELETE" })
            .done(() => {
                $(`tr[data-id="${id}"]`).fadeOut(300, function () {
                    $(this).remove();
                    if ($("#contactsBody tr").length === 0) showEmpty();
                    updateCount(parseInt($("#contactCount").text()) - 1);
                });
                showAlert("Contact deleted.", "success");
            })
            .fail(() => showAlert("Could not delete contact.", "danger"));
    });

    $("#contactForm").on("keydown", function (e) {
        if (e.key === "Enter") saveContact();
    });
});
