using ContactManager.Models;

namespace ContactManager.Services;

public interface IContactRepository
{
    IEnumerable<Contact> GetAll();
    Contact? GetById(Guid id);
    Contact Add(Contact contact);
    Contact? Update(Guid id, Contact updated);
    bool Delete(Guid id);

    // excludeId lets Update check for duplicates while ignoring the contact being updated
    bool ExistsByEmail(string email, Guid? excludeId = null);
}
