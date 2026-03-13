using ContactManager.Models;
using ContactManager.Models.Exceptions;
using ContactManager.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace ContactManager.Tests.Services;

public class ContactServiceTests
{
    private const string DefaultName  = "Alice";
    private const string DefaultEmail = "alice@example.com";
    private const string DefaultPhone = "555-1234";
    private const string AltName      = "Bob";
    private const string AltEmail     = "bob@example.com";

    private static Contact Make(
        string name  = DefaultName,
        string email = DefaultEmail,
        string phone = DefaultPhone) => new() { Name = name, Email = email, Phone = phone };

    private static (Mock<IContactRepository> repo, IContactService service) CreateSut()
    {
        var repo    = new Mock<IContactRepository>();
        var service = new ContactService(repo.Object, NullLogger<ContactService>.Instance);
        return (repo, service);
    }

    public class GetAllTests
    {
        [Fact]
        public void DelegatesToRepository()
        {
            var (repo, service) = CreateSut();
            var contacts = new List<Contact> { Make() };
            repo.Setup(r => r.GetAll()).Returns(contacts);

            var result = service.GetAll();

            result.Should().BeEquivalentTo(contacts);
            repo.Verify(r => r.GetAll(), Times.Once);
        }
    }

    public class AddTests
    {
        [Fact]
        public void UniqueEmail_DelegatesToRepository()
        {
            var (repo, service) = CreateSut();
            var contact = Make();
            var stored  = Make(); stored.Id = Guid.NewGuid();
            repo.Setup(r => r.ExistsByEmail(DefaultEmail, null)).Returns(false);
            repo.Setup(r => r.Add(contact)).Returns(stored);

            var result = service.Add(contact);

            result.Should().BeEquivalentTo(stored);
            repo.Verify(r => r.Add(contact), Times.Once);
        }

        [Fact]
        public void DuplicateEmail_ThrowsDuplicateEmailException()
        {
            var (repo, service) = CreateSut();
            repo.Setup(r => r.ExistsByEmail(DefaultEmail, null)).Returns(true);

            var act = () => service.Add(Make());

            act.Should().Throw<DuplicateEmailException>()
               .WithMessage($"*{DefaultEmail}*");
            repo.Verify(r => r.Add(It.IsAny<Contact>()), Times.Never);
        }
    }

    public class UpdateTests
    {
        [Fact]
        public void ExistingContact_DelegatesToRepository()
        {
            var (repo, service) = CreateSut();
            var id      = Guid.NewGuid();
            var input   = Make("Alice V2", "v2@example.com");
            var updated = new Contact { Id = id, Name = "Alice V2", Email = "v2@example.com" };
            repo.Setup(r => r.ExistsByEmail("v2@example.com", id)).Returns(false);
            repo.Setup(r => r.Update(id, input)).Returns(updated);

            var result = service.Update(id, input);

            result.Should().BeEquivalentTo(updated);
            repo.Verify(r => r.Update(id, input), Times.Once);
        }

        [Fact]
        public void DuplicateEmail_ThrowsDuplicateEmailException()
        {
            var (repo, service) = CreateSut();
            var id = Guid.NewGuid();
            repo.Setup(r => r.ExistsByEmail(AltEmail, id)).Returns(true);

            var act = () => service.Update(id, Make(AltName, AltEmail));

            act.Should().Throw<DuplicateEmailException>()
               .WithMessage($"*{AltEmail}*");
            repo.Verify(r => r.Update(It.IsAny<Guid>(), It.IsAny<Contact>()), Times.Never);
        }

        [Fact]
        public void UnknownId_ReturnsNull()
        {
            var (repo, service) = CreateSut();
            var id = Guid.NewGuid();
            repo.Setup(r => r.ExistsByEmail(DefaultEmail, id)).Returns(false);
            repo.Setup(r => r.Update(id, It.IsAny<Contact>())).Returns((Contact?)null);

            var result = service.Update(id, Make());

            result.Should().BeNull();
        }
    }

    public class DeleteTests
    {
        [Fact]
        public void ExistingContact_ReturnsTrue()
        {
            var (repo, service) = CreateSut();
            var id = Guid.NewGuid();
            repo.Setup(r => r.Delete(id)).Returns(true);

            service.Delete(id).Should().BeTrue();
            repo.Verify(r => r.Delete(id), Times.Once);
        }

        [Fact]
        public void UnknownId_ReturnsFalse()
        {
            var (repo, service) = CreateSut();
            var id = Guid.NewGuid();
            repo.Setup(r => r.Delete(id)).Returns(false);

            service.Delete(id).Should().BeFalse();
        }
    }

    public class SearchTests
    {
        [Theory]
        [InlineData("alice",       1)]
        [InlineData("ALICE",       1)]
        [InlineData("bob",         1)]
        [InlineData("example.com", 2)]
        [InlineData("",            2)]
        [InlineData("   ",         2)]
        [InlineData("zzz_nope",    0)]
        public void ReturnsExpectedCount(string query, int expectedCount)
        {
            var (repo, service) = CreateSut();
            var contacts = new List<Contact>
            {
                new() { Id = Guid.NewGuid(), Name = DefaultName, Email = DefaultEmail },
                new() { Id = Guid.NewGuid(), Name = AltName,     Email = AltEmail     },
            };
            repo.Setup(r => r.GetAll()).Returns(contacts);

            var result = service.Search(query);

            result.Should().HaveCount(expectedCount);
        }
    }
}
