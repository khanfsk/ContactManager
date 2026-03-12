using System.ComponentModel.DataAnnotations;

namespace ContactManager.Models;

public class Contact
{
    public Guid Id { get; set; }

    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Please enter a valid email.")]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Please enter a valid phone number.")]
    [StringLength(20)]
    public string Phone { get; set; } = string.Empty;
}
