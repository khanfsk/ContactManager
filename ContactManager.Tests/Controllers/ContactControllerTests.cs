using ContactManager.Controllers;
using ContactManager.Models;
using ContactManager.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace ContactManager.Tests.Controllers;

public class ContactControllerTests
{
    private const string DefaultName  = "Alice";
    private const string DefaultEmail = "alice@example.com";

    private static Contact Make(string name = DefaultName, string email = DefaultEmail)
        => new() { Name = name, Email = email };

    private static (Mock<IContactService> mock, ContactController controller) CreateSut()
    {
        var mock = new Mock<IContactService>();
        return (mock, new ContactController(mock.Object));
    }

    

    public class IndexTests
    {
        [Fact]
        public void ReturnsViewResult()
        {
            var (_, controller) = CreateSut();

            controller.Index().Should().BeOfType<ViewResult>();
        }
    }

  

    public class GetAllTests
    {
        private readonly Mock<IContactService> _mock;
        private readonly ContactController _controller;

        public GetAllTests()
        {
            (_mock, _controller) = CreateSut();
        }

        [Fact]
        public void ReturnsJsonWithContacts()
        {
            var contacts = new List<Contact> { new() { Id = Guid.NewGuid(), Name = DefaultName, Email = DefaultEmail } };
            _mock.Setup(s => s.GetAll()).Returns(contacts);

            var result = _controller.GetAll() as JsonResult;

            result!.Value.Should().BeEquivalentTo(contacts);
        }

        [Fact]
        public void DelegatesToService()
        {
            _mock.Setup(s => s.GetAll()).Returns([]);

            _controller.GetAll();

            _mock.Verify(s => s.GetAll(), Times.Once);
        }
    }

    
    public class SearchTests
    {
        private readonly Mock<IContactService> _mock;
        private readonly ContactController _controller;

        public SearchTests()
        {
            (_mock, _controller) = CreateSut();
        }

        [Fact]
        public void ReturnsJsonWithFilteredContacts()
        {
            var contacts = new List<Contact> { Make() };
            _mock.Setup(s => s.Search(DefaultName)).Returns(contacts);

            var result = _controller.Search(DefaultName) as JsonResult;

            result!.Value.Should().BeEquivalentTo(contacts);
            _mock.Verify(s => s.Search(DefaultName), Times.Once);
        }

        [Fact]
        public void NullQuery_PassesEmptyStringToService()
        {
            _mock.Setup(s => s.Search(string.Empty)).Returns([]);

            _controller.Search(null!);

            _mock.Verify(s => s.Search(string.Empty), Times.Once);
        }
    }
    

    public class CreateTests
    {
        private readonly Mock<IContactService> _mock;
        private readonly ContactController _controller;

        public CreateTests()
        {
            (_mock, _controller) = CreateSut();
        }

        [Fact]
        public void ValidContact_ReturnsCreatedContact()
        {
            var input   = Make();
            var created = new Contact { Id = Guid.NewGuid(), Name = DefaultName, Email = DefaultEmail };
            _mock.Setup(s => s.Add(input)).Returns(created);

            var result = _controller.Create(input) as JsonResult;

            result!.Value.Should().BeEquivalentTo(created);
            _mock.Verify(s => s.Add(input), Times.Once);
        }

        [Fact]
        public void InvalidModel_ReturnsBadRequest_WithoutCallingService()
        {
            _controller.ModelState.AddModelError("Name", "Required");

            var result = _controller.Create(new Contact());

            result.Should().BeOfType<BadRequestObjectResult>();
            _mock.Verify(s => s.Add(It.IsAny<Contact>()), Times.Never);
        }
    }

    

    public class UpdateTests
    {
        private readonly Mock<IContactService> _mock;
        private readonly ContactController _controller;

        public UpdateTests()
        {
            (_mock, _controller) = CreateSut();
        }

        [Fact]
        public void ExistingContact_ReturnsUpdatedContact()
        {
            var id      = Guid.NewGuid();
            var input   = Make("Alice V2", "v2@example.com");
            var updated = new Contact { Id = id, Name = "Alice V2", Email = "v2@example.com" };
            _mock.Setup(s => s.Update(id, input)).Returns(updated);

            var result = _controller.Update(id, input) as JsonResult;

            result!.Value.Should().BeEquivalentTo(updated);
            _mock.Verify(s => s.Update(id, input), Times.Once);
        }

        [Fact]
        public void UnknownContact_ReturnsNotFound()
        {
            var id = Guid.NewGuid();
            _mock.Setup(s => s.Update(id, It.IsAny<Contact>())).Returns((Contact?)null);

            var result = _controller.Update(id, Make());

            result.Should().BeOfType<NotFoundResult>();
        }
    }

    

    public class DeleteTests
    {
        private readonly Mock<IContactService> _mock;
        private readonly ContactController _controller;

        public DeleteTests()
        {
            (_mock, _controller) = CreateSut();
        }

        [Fact]
        public void ExistingContact_ReturnsOk()
        {
            var id = Guid.NewGuid();
            _mock.Setup(s => s.Delete(id)).Returns(true);

            var result = _controller.Delete(id);

            result.Should().BeOfType<OkResult>();
            _mock.Verify(s => s.Delete(id), Times.Once);
        }

        [Fact]
        public void UnknownContact_ReturnsNotFound()
        {
            var id = Guid.NewGuid();
            _mock.Setup(s => s.Delete(id)).Returns(false);

            var result = _controller.Delete(id);

            result.Should().BeOfType<NotFoundResult>();
            _mock.Verify(s => s.Delete(id), Times.Once);
        }
    }
}
