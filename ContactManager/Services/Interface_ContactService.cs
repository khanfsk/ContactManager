using ContactManager.Models;

namespace ContactManager.Services;

public interface IContactService
{
    IEnumerable<Contact> GetAll();
    Contact? GetById(Guid id);
    Contact Add(Contact contact);
    Contact? Update(Guid id, Contact contact);
    bool Delete(Guid id);
    IEnumerable<Contact> Search(string query);
}
