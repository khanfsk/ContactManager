using ContactManager.Models;
using ContactManager.Models.Exceptions;
using Microsoft.Extensions.Logging;

namespace ContactManager.Services;

public class ContactService : IContactService
{
    private readonly IContactRepository _repo;
    private readonly ILogger<ContactService> _logger;

    public ContactService(IContactRepository repo, ILogger<ContactService> logger)
    {
        _repo   = repo;
        _logger = logger;
    }

    public IEnumerable<Contact> GetAll()
    {
        _logger.LogDebug("Fetching all contacts");
        return _repo.GetAll();
    }

    public Contact? GetById(Guid id) => _repo.GetById(id);

    public Contact Add(Contact contact)
    {
        GuardDuplicateEmail(contact.Email);

        var created = _repo.Add(contact);
        _logger.LogInformation("Contact added: {Id} ({Email})", created.Id, created.Email);
        return created;
    }

    public Contact? Update(Guid id, Contact contact)
    {
        GuardDuplicateEmail(contact.Email, excludeId: id);

        var updated = _repo.Update(id, contact);

        if (updated is null)
            _logger.LogWarning("Update failed — contact not found: {Id}", id);
        else
            _logger.LogInformation("Contact updated: {Id}", id);

        return updated;
    }

    public bool Delete(Guid id)
    {
        var deleted = _repo.Delete(id);

        if (deleted)
            _logger.LogInformation("Contact deleted: {Id}", id);
        else
            _logger.LogWarning("Delete failed — contact not found: {Id}", id);

        return deleted;
    }

    public IEnumerable<Contact> Search(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return _repo.GetAll();

        return _repo.GetAll().Where(c =>
            c.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
            c.Email.Contains(query, StringComparison.OrdinalIgnoreCase));
    }

    private void GuardDuplicateEmail(string email, Guid? excludeId = null)
    {
        if (_repo.ExistsByEmail(email, excludeId))
        {
            _logger.LogWarning("Duplicate email attempt: {Email}", email);
            throw new DuplicateEmailException(email);
        }
    }
}
