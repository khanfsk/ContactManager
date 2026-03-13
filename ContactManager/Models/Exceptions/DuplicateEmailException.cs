namespace ContactManager.Models.Exceptions;

public class DuplicateEmailException : Exception
{
    public DuplicateEmailException(string email)
        : base($"A contact with email '{email}' already exists.") { }
}
