"use strict";

function newTempData(chart, dat) 
{
        if(chart) 
        {
            //timeChart.data.labels.push(formatTime(data.time))
            //timeChart.data.labels.push(dat.time)
            timeChart.data.labels.push(moment(dat.time).format('MM-DD    HH:mm')) 
            const datasQty =  timeChart.data.datasets.length   
        
            timeChart.data.datasets[0].data.push(datas[i])
            
            if(timeChart.data.datasets[0].data.length > 200)
                graphRemoveLast(timeChart)
            
                chart.update()  
          
        }    
    
}


async function createTimeChart(chart, label,titleText, units ) 
{
    const chartCanvas = document.getElementById('timeChart').getContext('2d');  
    
console.log('yo!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11)')


    const config = {
        type: 'line',
        data: {
            labels: moment().format('MM-DD    HH:mm') , //dbData.map(item => { return moment(item.time).format('MM-DD    HH:mm') }), 
            datasets: [
                {
                label:  label, //"<%- label %>",   // 0
                data:  0,//dbData.map(item => { return (item.data) }),
                spanGaps: false,
                showLines: true,
                fill: false,
                radius: 0.1,
                backgroundColor: 'rgba(225, 125, 10, 0.5)', 
                borderColor: 'rgba(225, 125, 10, 1)',
                borderWidth: 1,
                yAxisID: "y-axis",
                }

            ]
        },
        options: { 
           // responsive: true, 
            title:      {
                display: true,
                text:  titleText,//  "<%- titleText %>" //"Soil humidity"
            },
            scales: { 
                  yAxes: 
                  [
                    {
                        id: "y-axis",
                        ticks: {
                            suggestedMax: 100,
                            beginAtZero: true
                            },
                        scaleLabel: {
                            display: true,
                            labelString: units //"<%- units %>" 
                        }

                    }
                  ]  
                                            
            }
        }
    }

    chart = new Chart(chartCanvas, config );	

}