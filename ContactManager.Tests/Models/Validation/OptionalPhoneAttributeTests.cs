using System.ComponentModel.DataAnnotations;
using ContactManager.Models.Validation;
using FluentAssertions;
using Xunit;

namespace ContactManager.Tests.Models.Validation;

public class OptionalPhoneAttributeTests
{
    public class ValidInputs
    {
        private readonly OptionalPhoneAttribute _validator = new();
        private readonly ValidationContext _ctx = new(new object());

        [Theory]
        [InlineData("")]                  // empty — phone is optional, skip validation
        [InlineData("   ")]               // whitespace treated same as empty
        [InlineData(null)]                // null is fine
        [InlineData("5551234567")]        // plain 10 digits
        [InlineData("555-123-4567")]      // dashes
        [InlineData("(555) 123-4567")]    // parentheses
        [InlineData("+1 555 123 4567")]   // international with country code
        [InlineData("555.123.4567")]      // dots
        [InlineData("+44 20 7123 4567")]  // UK format
        public void IsAccepted(string? phone)
        {
            // Act
            var result = _validator.GetValidationResult(phone, _ctx);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }
    }

    public class InvalidInputs
    {
        private readonly OptionalPhoneAttribute _validator = new();
        private readonly ValidationContext _ctx = new(new object());

        [Theory]
        [InlineData("abc")]            // letters
        [InlineData("123")]            // too short
        [InlineData("not-a-phone!")]   // invalid chars
        [InlineData("@@@")]            // symbols only
        public void IsRejectedWithErrorMessage(string phone)
        {
            // Act
            var result = _validator.GetValidationResult(phone, _ctx);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().NotBeNullOrEmpty();
        }
    }
}
