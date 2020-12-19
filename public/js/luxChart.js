let luxChart

let luxData= {};

luxData.tstamp = []
luxData.ir = []
luxData.full = []
luxData.visible = []
luxData.lux = []

function getLastData()
{
    let IR = luxData.ir[luxData.ir.length - 1]
    let FULL = luxData.full[luxData.full.length - 1]
    let VISIBLE = luxData.visible[luxData.visible.length - 1]
    let LUX = luxData.lux[luxData.lux.length - 1]

    return {IR, FULL, VISIBLE, LUX }
}


function newLuxData(dat) 
{
    //console.log(dat)
    if(luxChart) {

        if(luxChart.data.datasets[0].data.length > 20) {
            graphRemoveLast(luxChart)
        }
            
        luxChart.data.labels.push(formatTime(dat.time))

        luxChart.data.datasets[0].data.push(dat.ir)  
        luxChart.data.datasets[1].data.push(dat.full)
        luxChart.data.datasets[2].data.push(dat.visible)  
        luxChart.data.datasets[3].data.push(dat.lux)  
    
        luxChart.update()  

    }    
}


function formatTime(timestamp)
{
    // Create a new JavaScript Date object based on the timestamp and retreive time value from it
    var date = new Date(timestamp);
    var hours = date.getHours();
    var minutes =  date.getMinutes();
    var seconds = date.getSeconds();

    // Will display time in 10:30:23 format
    var formattedTime = hours.toString().padStart(2, '0') + ':' +  
    minutes.toString().padStart(2, '0') + ':' +  
    seconds.toString().padStart(2, '0'); 

    return(formattedTime)
}


function graphRemoveLast(chart, update = false)
{
    chart.data.datasets.forEach((dataset) => {
        dataset.data.shift(); // remove the first left value
    });     
    
    chart.data.labels.shift();

    if(update) chart.update()
}


function resetLuxChart(data) 
{

    luxData.tstamp.splice(0, luxData.tstamp.length)
    luxData.ir.splice(0, luxData.ir.length)
    luxData.full.splice(0, luxData.full.length)
    luxData.visible.splice(0, luxData.visible.length)
    luxData.lux.splice(0, luxData.lux.length)

    createLuxChart(data) 
}


async function createLuxChart(data) 
{
  
    /*var Labels = data.map(function(d) {return d.time});
    var grafData = data.map(function(d) {return d.Weeks;});*/


    for (item of data) {  //  TODO: fix newData() pour l'utiliser ici
        luxData.tstamp.push(formatTime(item.time))

        luxData.ir.push(item.ir)
        luxData.full.push(item.full)
        luxData.visible.push(item.visible)
        luxData.lux.push(item.lux)
    }


    const luxCanvas = document.getElementById('luxChart').getContext('2d');
             
    var gradientGray = luxCanvas.createLinearGradient(0, 0, 0, 250);
    gradientGray.addColorStop(0, 'rgba(25,25,25,0.9)');   
    gradientGray.addColorStop(1, 'rgba(25,25,25,0.1)');

    var gradientBlue = luxCanvas.createLinearGradient(0, 0, 0, 100);
    gradientBlue.addColorStop(0, 'rgba(25,25,255,0.9)');   
    gradientBlue.addColorStop(1, 'rgba(25,25,255,0.1)');


    luxChart = new Chart(luxCanvas, {
        type: 'line',
        data: {
            labels: luxData.tstamp,
            datasets: [
                {
                label: 'IR',   // 0
                data:  luxData.ir,
                spanGaps: false,
                showLines: true,
                fill: false,
                radius: 0.1,
                backgroundColor: 'rgba(220, 10, 10, 0.5)', 
                borderColor: 'rgba(220, 10, 10, 1)',
                borderWidth: 1,
                yAxisID: "y-axis",
                },
                {
                label: 'Full',  // 2
                data:  luxData.full,
                spanGaps: false,
                showLines: true,
                radius: 0,
                type: 'line',
                fill: true,
                backgroundColor: gradientBlue, 
                borderColor: 'rgba(25,25,255,0.1)',
                borderWidth: 2,
                yAxisID: "y-axis"
                } ,
                {
                label: 'Visible',   // 3
                data:  luxData.visible,
                spanGaps: false,
                showLines: true,
                radius: 0,
                type: 'line',
                fill: false,
                backgroundColor: 'rgba(5,5,5,0.9)',
                borderColor: 'rgba(5,5,5,0.9)',
                borderWidth: 2,
                yAxisID: "y-axis"
                } ,
                {
                label: 'Lux',   // 3
                data:  luxData.lux,
                spanGaps: false,
                showLines: true,
                radius: 0,
                type: 'line',
                fill: true,
                backgroundColor: gradientGray,
                borderColor: 'rgba(25,25,25,0.1)',
                borderWidth: 2,
                yAxisID: "y-axis-lux"
                } 

            ]
        },
        options: {  
            scales: { 
                yAxes: [
                    {
                        id: "y-axis",
                        ticks: {
                           
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'value'
                        }

                    },
                    {
                        id: 'y-axis-lux',
                        position: 'right',
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: 20
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Lux'
                        }

                    }
                ]  
                                            
            }
        }
    })

}
