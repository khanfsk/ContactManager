using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace ContactManager.Models.Validation;

// .NET's built-in [Phone] rejects empty strings, which breaks optional phone fields.
// This attribute only validates the format when a value is actually provided.
public class OptionalPhoneAttribute : ValidationAttribute
{
    private static readonly Regex PhoneRegex = new(@"^[\d\s\+\-\(\)\.]{7,20}$", RegexOptions.Compiled);

    public OptionalPhoneAttribute()
    {
        ErrorMessage = "Please enter a valid phone number.";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not string phone || string.IsNullOrWhiteSpace(phone))
            return ValidationResult.Success;

        return PhoneRegex.IsMatch(phone.Trim())
            ? ValidationResult.Success
            : new ValidationResult(ErrorMessage);
    }
}
