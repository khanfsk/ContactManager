using ContactManager.Models;
using ContactManager.Services;
using Microsoft.AspNetCore.Mvc;

namespace ContactManager.Controllers;

[Route("[controller]")]
public class ContactController : Controller
{
    private readonly IContactService _contactService;

    public ContactController(IContactService contactService)
    {
        _contactService = contactService;
    }

    public IActionResult Index() => View();

    [HttpGet("GetAll")]
    public IActionResult GetAll() => Json(_contactService.GetAll());

    [HttpGet("Search")]
    public IActionResult Search(string query) => Json(_contactService.Search(query ?? string.Empty));

    [HttpPost("Create")]
    public IActionResult Create([FromBody] Contact contact)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = _contactService.Add(contact);
        return Json(created);
    }

    [HttpPut("Update/{id}")]
    public IActionResult Update(Guid id, [FromBody] Contact contact)
    {
        var updated = _contactService.Update(id, contact);
        if (updated is null)
            return NotFound();

        return Json(updated);
    }

    [HttpDelete("Delete/{id}")]
    public IActionResult Delete(Guid id)
    {
        var deleted = _contactService.Delete(id);
        if (!deleted)
            return NotFound();

        return Ok();
    }
}
