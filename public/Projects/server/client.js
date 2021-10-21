console.log('server stats!');

const errorElement = document.querySelector('.error-message');
const loadingElement = document.querySelector('.loading');
const bootsElement = document.querySelector('.boots');
const loadMoreElement = document.querySelector('#loadMore');
const API_URL =  'http://192.168.0.33/server';

let skip = 0;
let limit = 30;    //   TODO:  si le limit est plus petit que window et y apas de scroll....   le scroll event launch pas
let loading = false;
let finished = false;
let collection = 'alarms'

/*server
postsesps
users
posts
alarms
heartbeats*/

errorElement.style.display = 'none';

document.addEventListener('scroll' ,() => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading && !finished) {
        loadMore();
    }
});

listAll();



function loadMore() {
    skip += limit;
    listAll(false);
}

function listAll(reset = true) {
  loading = true;
  if (reset) {
      console.log('reset')
      bootsElement.innerHTML = ''
      skip = 0;
      finished = false;
  }
  const url = `${API_URL}/list?skip=${skip}&limit=${limit}&collection=${collection}`
  fetch(url)
    .then(response => response.json())
    .then(result => {
          console.log(result.data)
          result.data.forEach(log => {
              const div = document.createElement('div')

              const header = document.createElement('h3')
              header.textContent = log._id//log.name;

              const date = document.createElement('small')
              date.textContent = log.time//new Date(log.date)

              div.appendChild(header)
              div.appendChild(date)

              bootsElement.appendChild(div)
        });
      loadingElement.style.display = 'none'
      console.log(result.meta.has_more ? "has more" : "done")
      if (!result.meta.has_more) {
          loadMoreElement.style.visibility = 'hidden'
          finished = true
      } else {
          loadMoreElement.style.visibility = 'visible'
      }
      loading = false
    })
}