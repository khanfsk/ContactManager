using ContactManager.Models;
using ContactManager.Services;
using FluentAssertions;
using Xunit;

namespace ContactManager.Tests.Services;

public class ContactRepositoryTests
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

    public class GetAllTests
    {
        private readonly IContactRepository _repo = new InMemoryContactRepository();

        [Fact]
        public void WhenEmpty_ReturnsEmptyList()
        {
            _repo.GetAll().Should().BeEmpty();
        }

        [Fact]
        public void AfterAddingContacts_ReturnsAll()
        {
            _repo.Add(Make());
            _repo.Add(Make(AltName, AltEmail));

            _repo.GetAll().Should().HaveCount(2);
        }
    }

    public class AddTests
    {
        private readonly IContactRepository _repo = new InMemoryContactRepository();

        [Fact]
        public void AssignsNonEmptyId()
        {
            var result = _repo.Add(Make());

            result.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public void EachContactGetsUniqueId()
        {
            var first  = _repo.Add(Make());
            var second = _repo.Add(Make(AltName, AltEmail));

            first.Id.Should().NotBe(second.Id);
        }

        [Fact]
        public void StoredContact_AppearsInGetAll()
        {
            _repo.Add(Make());

            _repo.GetAll().Should().HaveCount(1);
        }
    }

    public class GetByIdTests
    {
        private readonly IContactRepository _repo = new InMemoryContactRepository();

        [Fact]
        public void ExistingId_ReturnsCorrectContact()
        {
            var added = _repo.Add(Make());

            var result = _repo.GetById(added.Id);

            result.Should().NotBeNull();
            result!.Id.Should().Be(added.Id);
        }

        [Fact]
        public void UnknownId_ReturnsNull()
        {
            _repo.GetById(Guid.NewGuid()).Should().BeNull();
        }
    }

    public class UpdateTests
    {
        private readonly IContactRepository _repo = new InMemoryContactRepository();

        [Fact]
        public void ExistingContact_UpdatesAllFields()
        {
            var added   = _repo.Add(Make());
            var updated = new Contact { Name = "Alice V2", Email = "v2@example.com", Phone = "999" };

            var result = _repo.Update(added.Id, updated);

            result.Should().NotBeNull();
            result!.Name.Should().Be("Alice V2");
            result.Email.Should().Be("v2@example.com");
            result.Phone.Should().Be("999");
        }

        [Fact]
        public void ExistingContact_PreservesId()
        {
            var added = _repo.Add(Make());

            var result = _repo.Update(added.Id, Make("Alice V2", "v2@example.com"));

            result!.Id.Should().Be(added.Id);
        }

        [Fact]
        public void UnknownId_ReturnsNull()
        {
            var result = _repo.Update(Guid.NewGuid(), Make());

            result.Should().BeNull();
        }
    }

    public class DeleteTests
    {
        private readonly IContactRepository _repo = new InMemoryContactRepository();

        [Fact]
        public void ExistingContact_ReturnsTrue()
        {
            var added = _repo.Add(Make());

            _repo.Delete(added.Id).Should().BeTrue();
        }

        [Fact]
        public void ExistingContact_RemovesFromList()
        {
            var added = _repo.Add(Make());

            _repo.Delete(added.Id);

            _repo.GetAll().Should().BeEmpty();
        }

        [Fact]
        public void DoesNotAffectOtherContacts()
        {
            var alice = _repo.Add(Make());
            var bob   = _repo.Add(Make(AltName, AltEmail));

            _repo.Delete(alice.Id);

            _repo.GetAll().Should().ContainSingle(c => c.Id == bob.Id);
        }

        [Fact]
        public void UnknownId_ReturnsFalse()
        {
            _repo.Delete(Guid.NewGuid()).Should().BeFalse();
        }
    }

    public class ExistsByEmailTests
    {
        private readonly IContactRepository _repo = new InMemoryContactRepository();

        [Fact]
        public void KnownEmail_ReturnsTrue()
        {
            _repo.Add(Make());

            _repo.ExistsByEmail(DefaultEmail).Should().BeTrue();
        }

        [Fact]
        public void UnknownEmail_ReturnsFalse()
        {
            _repo.ExistsByEmail("nobody@example.com").Should().BeFalse();
        }

        [Fact]
        public void EmailCheck_IsCaseInsensitive()
        {
            _repo.Add(Make());

            _repo.ExistsByEmail(DefaultEmail.ToUpper()).Should().BeTrue();
        }

        [Fact]
        public void ExcludeId_IgnoresOwnEmail()
        {
            var added = _repo.Add(Make());

            _repo.ExistsByEmail(DefaultEmail, excludeId: added.Id).Should().BeFalse();
        }

        [Fact]
        public void ExcludeId_StillDetectsDuplicateFromOtherContact()
        {
            var alice = _repo.Add(Make());
            _repo.Add(Make(AltName, AltEmail));

            _repo.ExistsByEmail(DefaultEmail, excludeId: alice.Id).Should().BeFalse();
            _repo.ExistsByEmail(AltEmail, excludeId: alice.Id).Should().BeTrue();
        }
    }
}
