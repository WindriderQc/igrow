console.log('server stats!');

const errorElement = document.querySelector('.error-message');
const loadingElement = document.querySelector('.loading');
const bootsElement = document.querySelector('.boots');
const loadMoreElement = document.querySelector('#loadMore');
const API_URL =  'http://localhost:3001/database';   //IGROW_IP   // TODO: recevoir du server ejs

let skip = 0;
let limit = 30;    //   TODO:  si le limit est plus petit que window et y apas de scroll....   le scroll event launch pas
let loading = false;
let finished = false;


errorElement.style.display = 'none';

document.addEventListener('scroll' ,() => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading && !finished) {
        loadMore();
    }
});




function loadMore() {
        skip += limit;
        listAll(null, false)
}

async function listAll( selectedCollection, reset = true) {
    loading = true;
    if (reset) {
        console.log('reset')
        bootsElement.innerHTML = ''
        skip = 0;
        finished = false;
    }

  
    const params = {
        skip: document.getElementById('skip_id').value, 
        limit: document.getElementById('limit_id').value, 
        sort: document.getElementById('sort_id').value, 
        collection: selectedCollection ? selectedCollection : ""
    }
    const url = `${API_URL}/list?skip=${params.skip}&limit=${params.limit}&sort=${params.sort}&collection=${params.collection}`
    console.log(url)

    const response = await fetch(url)
    const result = await response.json()
    
    console.log(result.data)

    if(result.data) {
        result.data.forEach(log => {
                const div = document.createElement('div')

                const header = document.createElement('h5')
                header.className = header.className + " my-3"
            //  header.textContent = log.email ? log.email : log._id//log.name;
                header.textContent = log._id

                const text = document.createElement('small')
                text.textContent = JSON.stringify(log)//new Date(log.date)


                div.appendChild(header)
                div.appendChild(text)

                bootsElement.appendChild(div)
            })

        loadingElement.style.display = 'none'
        console.log(result.meta.has_more ? "has more" : "done")
        if (!result.meta.has_more) {
            loadMoreElement.style.visibility = 'hidden'
            finished = true
        } else {
            loadMoreElement.style.visibility = 'visible'
        }
    }

    loading = false
    


 /* fetch(url)
    .then(response => response.json())
    .then(result => {
          console.log(result.data)
          result.data.forEach(log => {
              const div = document.createElement('div')

              const header = document.createElement('h5')
              header.className = header.className + " my-3"
            //  header.textContent = log.email ? log.email : log._id//log.name;
              header.textContent = log._id

              const text = document.createElement('small')
              text.textContent = JSON.stringify(log)//new Date(log.date)


              div.appendChild(header)
              div.appendChild(text)
    
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
    })*/
}





class DBSelecter {
    constructor(collectionList, collectionSelected, html_dom, onChangeCallback = null ) 
    {
        this.selectDom = html_dom
        this.collectionList = collectionList
        this.selectElm = document.getElementById(html_dom)
        this.changeCallback = onChangeCallback ?  onChangeCallback  :  null

        if(this.collectionList.length != 0) {

            for(let col in this.collectionList) {
                this.selectElm.options[this.selectElm.options.length] = new Option(this.collectionList[col], col)
            }

            let index = this.collectionList.indexOf(collectionSelected)
            this.selectElm.options[index].selected = "true"
            this.selectedCollection = this.getSelectText()
            console.log("Setting selected: " + this.selectedCollection)
        }  
        else  console.log('no Collection list')   
        
    }


    getSelectText()
    {
        //this.selectedCollection = select.options[selectedOption].text
        let txt = $("#" + this.selectDom + ">option:selected").text()
        return txt
    }


    updateSelected()
    { 
        this.selectedCollection = this.getSelectText()
        console.log("Selecting: " + this.selectedCollection)

        if(this.changeCallback) this.changeCallback()  
    }




}