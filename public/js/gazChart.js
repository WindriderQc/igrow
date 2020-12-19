let gazChart

let gazData= {};

gazData.tstamp = []
gazData.lpg = []
gazData.co = []
gazData.smoke = []

function getLastData()
{
    let LPG = gazData.lpg[gazData.lpg.length - 1]
    let CO = gazData.co[gazData.co.length - 1]
    let SMOKE = gazData.smoke[gazData.smoke.length - 1]

    return {LPG, CO, SMOKE }
}


function newGazData(dat) 
{
    //console.log(dat)
    if(gazChart) {

        if(gazChart.data.datasets[0].data.length > 20) {
            graphRemoveLast(gazChart)
        }
            
        gazChart.data.labels.push(formatTime(dat.time))

        gazChart.data.datasets[0].data.push(dat.lpg)  
        gazChart.data.datasets[1].data.push(dat.co2)
        gazChart.data.datasets[2].data.push(dat.smoke)  

    
        gazChart.update()  

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

function resetGazChart(data) 
{

    gazData.tstamp.splice(0, gazData.tstamp.length)
    gazData.lpg.splice(0, gazData.lpg.length)
    gazData.co.splice(0, gazData.co.length)
    gazData.smoke.splice(0, gazData.smoke.length)

    createGazChart(data)
}

async function createGazChart(data) 
{

    /*var Labels = data.map(function(d) {return d.time});
    var grafData = data.map(function(d) {return d.Weeks;});*/


    for (item of data) {  //  TODO: fix newData() pour l'utiliser ici
        gazData.tstamp.push(formatTime(item.time))

        gazData.lpg.push(item.lpg)
        gazData.co.push(item.co2)
        gazData.smoke.push(item.smoke)
    }


    const gazCanvas = document.getElementById('gazChart').getContext('2d');
             
    var gradientGray = gazCanvas.createLinearGradient(0, 0, 0, 250);
    gradientGray.addColorStop(0, 'rgba(25,25,25,0.9)');   
    gradientGray.addColorStop(1, 'rgba(25,25,25,0.1)');

    gazChart = new Chart(gazCanvas, {
        type: 'line',
        data: {
            labels: gazData.tstamp,
            datasets: [
                {
                label: 'LPG',   // 0
                data:  gazData.lpg,
                spanGaps: false,
                showLines: true,
                fill: false,
                radius: 0.1,
                backgroundColor: 'rgba(220, 10, 10, 0.5)', 
                borderColor: 'rgba(220, 10, 10, 1)',
                borderWidth: 1,
                yAxisID: "y-axis-ppm",
                },
                {
                label: 'Co2',  // 2
                data:  gazData.co,
                spanGaps: false,
                showLines: true,
                radius: 0,
                type: 'line',
                fill: false,
                backgroundColor: 'rgba(225, 125, 10, 0.5)', 
                borderColor: 'rgba(225, 125, 10, 1)',
                borderWidth: 1,
                yAxisID: "y-axis-ppm"
                } ,
                {
                label: 'smoke',   // 3
                data:  gazData.smoke,
                spanGaps: false,
                showLines: true,
                radius: 0,
                type: 'line',
                fill: true,
                backgroundColor: gradientGray,
                borderColor: 'rgba(25,25,25,0.1)',
                borderWidth: 2,
                yAxisID: "y-axis-ppm"
                } 

            ]
        },
        options: {  
            scales: { 
                yAxes: [
                    {
                        id: "y-axis-ppm",
                        ticks: {
                            suggestedMax: 200,
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'ppm'
                        }

                    }
                ]  
                                            
            }
        }
    })

}
