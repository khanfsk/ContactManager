using System.Collections.Concurrent;
using ContactManager.Models;

namespace ContactManager.Services;

public class InMemoryContactRepository : IContactRepository
{
    private readonly ConcurrentDictionary<Guid, Contact> _store = new();

    public IEnumerable<Contact> GetAll() => _store.Values.ToList();

    public Contact? GetById(Guid id) =>
        _store.TryGetValue(id, out var contact) ? contact : null;

    public Contact Add(Contact contact)
    {
        contact.Id = Guid.NewGuid();
        _store[contact.Id] = contact;
        return contact;
    }

    public Contact? Update(Guid id, Contact updated)
    {
        if (!_store.TryGetValue(id, out var existing))
            return null;

        existing.Name  = updated.Name;
        existing.Email = updated.Email;
        existing.Phone = updated.Phone;

        return existing;
    }

    public bool Delete(Guid id) => _store.TryRemove(id, out _);

    public bool ExistsByEmail(string email, Guid? excludeId = null) =>
        _store.Values.Any(c =>
            string.Equals(c.Email, email, StringComparison.OrdinalIgnoreCase) &&
            c.Id != excludeId);
}
