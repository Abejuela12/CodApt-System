(async ()=>{
  try{
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email:'learner1@codapt.test', password:'1234'})
    });
    console.log('status', res.status);
    const text = await res.text();
    console.log('body:', text);
  } catch(err){
    console.error('err', err);
  }
})();
