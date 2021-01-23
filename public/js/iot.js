class Iot {
    constructor(mqttlogin, deviceList) 
    {
        this.selectedDevice = "";
        this.deviceList = deviceList;
        this.callback_ = null;
     
        let options = {
            rejectUnauthorized: false, 
            username: mqttlogin.user,        //  TODO : NOT SAFE!!   visible dans la console....   utiliser le header pour ca?  ou mettre en SSL
            password: mqttlogin.pass
        }

        console.log('attempting mqtt connect mqtt client:')
        this.mqClient = mqtt.connect('ws://192.168.0.33:9001', options)   //TODO  hardcoded IP + check...  using ws to connect not ssl secure
        console.log(this.mqClient)

        this.mqClient.on('error', (err) =>{   console.log(err)    })
    } 

    setHtmlSelectList(html_dom, selectedOption)
    {
        let select = document.getElementById( html_dom )

        for(let index in this.deviceList) {
            select.options[select.options.length] = new Option(this.deviceList[index], index);
        }

        document.getElementById( html_dom ).options[selectedOption].selected = "true";
        
        this.selectedDevice = document.getElementById( html_dom ).options[selectedOption].text
    }


    async setDevicesListOnSelect(html_dom, _callback = null)
    {
        if(this.deviceList.length != 0)  this.setHtmlSelectList(html_dom, 0) 
        else  console.log('no ESP found in DB')
           
        if(_callback){ this.callback_ = _callback; _callback()   }       
    }


    updateSelected()
    {
        this.selectedDevice = $("#" + this.Process + ">option:selected").text()
        
        this.callback_()
    }


    async updateStatus()
    {       
       // const resp =  await this.getDeviceList()
       // const list = resp.json()
        const list =  this.deviceList
        //console.log(list)
     
        list.forEach( async (esp) =>{      //  TODO:  détecte les disconnected.   mais juste si IoT.ejs est affiché...  doit etre dans serveur...
     
           const latest =  await fetch('/deviceLatest/' + esp)
           const result = await latest.json()
  
            document.getElementById(esp + '_li2').innerHTML = result[0].lastConnect.toFixed(4) 
             
     
        })

    
    }

    async setDevicesListOnList(dom_list, dom_status, _callback = null)
    {
        this.domList = dom_list
               
        let items = this.deviceList
       // console.log(items)
        let sender_ul = document.createElement('ul')
        let status_ul = document.createElement('ul')
        
        document.getElementById(dom_list).appendChild(sender_ul)
        document.getElementById(dom_status).appendChild(status_ul)
        
        
        items.forEach( async (esp) =>{

            const latest =  await fetch('/deviceLatest/' + esp)
            const result = await latest.json()
            console.log(result)
                

            let li = document.createElement('li')
            li.id = esp + '_li'
            sender_ul.appendChild(li)
            li.innerHTML += esp
        
            let li2 = document.createElement('li')
            li2.id = esp + '_li2'
            status_ul.appendChild(li2)
            li2.innerHTML = "OFF" //result //"status"

           

        })
         

       
    }

 
}
