const fetch = global.fetch;
(async () => {
  try {
    const listRes = await fetch('http://localhost:5000/api/admin/problems');
    const problems = await listRes.json();
    console.log('PROBLEMS COUNT:', problems.length);
    if (!Array.isArray(problems) || problems.length === 0) return;
    const first = problems[0];
    console.log('FIRST BEFORE:', { id: first.id, archived: first.archived });
    const archiveRes = await fetch(`http://localhost:5000/api/admin/problems/${first.id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true })
    });
    const archived = await archiveRes.json();
    console.log('ARCHIVED RESPONSE:', archived);
    const afterArchiveRes = await fetch('http://localhost:5000/api/admin/problems');
    const afterArchiveProblems = await afterArchiveRes.json();
    const afterFirst = afterArchiveProblems.find(p => p.id === first.id);
    console.log('FIRST AFTER ARCHIVE:', { id: afterFirst.id, archived: afterFirst.archived });
    const unarchiveRes = await fetch(`http://localhost:5000/api/admin/problems/${first.id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: false })
    });
    const unarchived = await unarchiveRes.json();
    console.log('UNARCHIVED RESPONSE:', unarchived);
    const afterUnarchiveRes = await fetch('http://localhost:5000/api/admin/problems');
    const afterUnarchiveProblems = await afterUnarchiveRes.json();
    const finalFirst = afterUnarchiveProblems.find(p => p.id === first.id);
    console.log('FIRST AFTER UNARCHIVE:', { id: finalFirst.id, archived: finalFirst.archived });
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
})();
