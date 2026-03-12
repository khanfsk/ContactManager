using ContactManager.Models;
using ContactManager.Services;
using FluentAssertions;
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

    // -------------------------------------------------------------------------

    public class GetAllTests
    {
        private readonly IContactService _service = new ContactService();

        [Fact]
        public void WhenEmpty_ReturnsEmptyList()
        {
            _service.GetAll().Should().BeEmpty();
        }

        [Fact]
        public void AfterAddingContacts_ReturnsAll()
        {
            _service.Add(Make());
            _service.Add(Make(AltName, AltEmail));

            _service.GetAll().Should().HaveCount(2);
        }
    }

    // -------------------------------------------------------------------------

    public class AddTests
    {
        private readonly IContactService _service = new ContactService();

        [Fact]
        public void AssignsNonEmptyId()
        {
            var result = _service.Add(Make());

            result.Id.Should().NotBe(Guid.Empty);
        }

        // Service owns ID generation — a caller-supplied ID should be overwritten
        [Fact]
        public void IgnoresIncomingId()
        {
            var incoming = Guid.NewGuid();
            var contact = Make();
            contact.Id = incoming;

            var result = _service.Add(contact);

            result.Id.Should().NotBe(incoming);
        }

        [Fact]
        public void EachContactGetsUniqueId()
        {
            var first  = _service.Add(Make());
            var second = _service.Add(Make(AltName, AltEmail));

            first.Id.Should().NotBe(second.Id);
        }

        [Fact]
        public void StoredContact_AppearsInGetAll()
        {
            _service.Add(Make());

            _service.GetAll().Should().HaveCount(1);
        }
    }

    // -------------------------------------------------------------------------

    public class GetByIdTests
    {
        private readonly IContactService _service = new ContactService();

        [Fact]
        public void ExistingId_ReturnsCorrectContact()
        {
            var added = _service.Add(Make());

            var result = _service.GetById(added.Id);

            result.Should().NotBeNull();
            result!.Id.Should().Be(added.Id);
        }

        [Fact]
        public void UnknownId_ReturnsNull()
        {
            _service.GetById(Guid.NewGuid()).Should().BeNull();
        }
    }

    // -------------------------------------------------------------------------

    public class UpdateTests
    {
        private readonly IContactService _service = new ContactService();

        [Fact]
        public void ExistingContact_UpdatesAllFields()
        {
            var added = _service.Add(Make());

            var result = _service.Update(added.Id, new Contact { Name = "Alice V2", Email = "v2@example.com", Phone = "999" });

            result.Should().NotBeNull();
            result!.Name.Should().Be("Alice V2");
            result.Email.Should().Be("v2@example.com");
            result.Phone.Should().Be("999");
        }

        [Fact]
        public void ExistingContact_PreservesId()
        {
            var added = _service.Add(Make());

            var result = _service.Update(added.Id, Make("Alice V2", "v2@example.com"));

            result!.Id.Should().Be(added.Id);
        }

        [Fact]
        public void DoesNotAffectOtherContacts()
        {
            var alice = _service.Add(Make());
            var bob   = _service.Add(Make(AltName, AltEmail));

            _service.Update(alice.Id, Make("Alice V2", "v2@example.com"));

            _service.GetById(bob.Id)!.Name.Should().Be(AltName);
        }

        [Fact]
        public void UnknownId_ReturnsNull()
        {
            var result = _service.Update(Guid.NewGuid(), Make());

            result.Should().BeNull();
        }
    }

    // -------------------------------------------------------------------------

    public class DeleteTests
    {
        private readonly IContactService _service = new ContactService();

        [Fact]
        public void ExistingContact_ReturnsTrue()
        {
            var added = _service.Add(Make());

            _service.Delete(added.Id).Should().BeTrue();
        }

        [Fact]
        public void ExistingContact_RemovesFromList()
        {
            var added = _service.Add(Make());

            _service.Delete(added.Id);

            _service.GetAll().Should().BeEmpty();
        }

        [Fact]
        public void DoesNotAffectOtherContacts()
        {
            var alice = _service.Add(Make());
            var bob   = _service.Add(Make(AltName, AltEmail));

            _service.Delete(alice.Id);

            _service.GetAll().Should().ContainSingle(c => c.Id == bob.Id);
        }

        [Fact]
        public void UnknownId_ReturnsFalse()
        {
            _service.Delete(Guid.NewGuid()).Should().BeFalse();
        }
    }

    // -------------------------------------------------------------------------

    public class SearchTests
    {
        private readonly IContactService _service = new ContactService();

        // seeds two contacts: alice@example.com and bob@example.com
        public SearchTests()
        {
            _service.Add(Make());
            _service.Add(Make(AltName, AltEmail));
        }

        [Theory]
        [InlineData("alice",       1)]  // matches name
        [InlineData("ALICE",       1)]  // case insensitive
        [InlineData("bob",         1)]  // matches other contact
        [InlineData("example.com", 2)]  // both share the same domain
        [InlineData("",            2)]  // empty = return all
        [InlineData("   ",         2)]  // whitespace = return all
        [InlineData("zzz_nope",    0)]  // no match
        public void ReturnsExpectedCount(string query, int expectedCount)
        {
            _service.Search(query).Should().HaveCount(expectedCount);
        }

        [Fact]
        public void ByEmail_ReturnsCorrectContact()
        {
            var result = _service.Search("alice@example.com");

            result.Should().ContainSingle(c => c.Name == DefaultName);
        }
    }
}
