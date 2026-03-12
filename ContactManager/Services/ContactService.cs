using ContactManager.Models;

namespace ContactManager.Services;

public class ContactService : IContactService
{
    private readonly List<Contact> _contacts = [];

    public IEnumerable<Contact> GetAll() => _contacts.AsReadOnly();

    public Contact? GetById(Guid id) =>
        _contacts.FirstOrDefault(c => c.Id == id);

    public Contact Add(Contact contact)
    {
        contact.Id = Guid.NewGuid();
        _contacts.Add(contact);
        return contact;
    }

    public Contact? Update(Guid id, Contact contact)
    {
        var existing = _contacts.FirstOrDefault(c => c.Id == id);
        if (existing is null) return null;

        existing.Name = contact.Name;
        existing.Email = contact.Email;
        existing.Phone = contact.Phone;
        return existing;
    }

    public bool Delete(Guid id)
    {
        var contact = _contacts.FirstOrDefault(c => c.Id == id);
        if (contact is null) return false;

        _contacts.Remove(contact);
        return true;
    }

    public IEnumerable<Contact> Search(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return GetAll();

        return _contacts.Where(c =>
            c.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
            c.Email.Contains(query, StringComparison.OrdinalIgnoreCase));
    }
}
