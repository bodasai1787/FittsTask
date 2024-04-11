class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Task {
    constructor(A, W, N) {
        this.A = A;
        this.W = W;
        this.N = N;
    }
}

//App variables
let isAppStarted = false;

//Task variables
let tasks = [];
let taskIdx = 0;
let isTaskStarted = false;
let taskClickNumber = 0;

//Task Data
let currentClickTime;
let previousClickTime;
let movementTime = 0;
let correctClicksCount = 0;
let clickData = [];
let aggregateTaskResult = [];
let overallMeanResult = [];

//regisitering form submission event
$(document).on("click", "#form-submit-btn", function() {
    let A_raw = $("#amplitude").val();
    let W_raw = $("#width").val();
    let N = $("#targets").val();
    let A = A_raw.split(',').map(function(s){return s.trim()})
    let W = W_raw.split(',').map(function(s){return s.trim()})
    if(A.every((val)=>!isNaN(val))){
        A = A.map((str)=>parseInt(str));
    }
    if(W.every((val)=>!isNaN(val))){
        W = W.map((str)=>parseInt(str))
    }
    if(!isNaN(N)){
        N = parseInt(N);
    }
    beginApp(A, W, N)
  })

// initialising and starting app
function beginApp(A, W, N){
    taskIdx = 0;
    clickNumber = 0;
    clickData = [];
    aggregateTaskResult = [];
    overallMeanResult = [];
    generateTaskList(A, W, N);
    // add shuffling logic
    isAppStarted = true;
    $("#main-menu").hide();
}

// regisitering canvas click event
$(document).on("click", "canvas", function() {
    if(isAppStarted){
        onCanvasClick()
    }
});

function onCanvasClick(){
    let clickPos = new Pos(mouseX, mouseY);
    let targetPos = getTargetCoordinates(tasks[taskIdx].A, tasks[taskIdx].N,getTargetIndexFromClickNumber(taskClickNumber, tasks[taskIdx].N))
    if(!isTaskStarted)
    {
       if(isClickCorrect(clickPos, targetPos, tasks[taskIdx].W/2))
         {
              isTaskStarted = true;
              taskClickNumber = 1;
              console.log('task started')
              currentClickTime = millis();
              previousClickTime = currentClickTime;
         }
    }
    else{
        currentClickTime = millis();
        computeClickData(clickPos, currentClickTime-previousClickTime)
        taskClickNumber++;
        previousClickTime = currentClickTime;
    }
  }

// initial canvas setup function
function setup() {
    canvas.id = 'task-canvas'
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
}

function draw(){
    background(255)
    if(isAppStarted){
        executeTask()
    }
}

function executeTask(){
    if(taskIdx == tasks.length){
        aggregateClickDataForTask();
        displayTaskData();
        noLoop();
    }else{
        let A_cur = tasks[taskIdx].A;
        let W_cur = tasks[taskIdx].W;
        let N_cur = tasks[taskIdx].N;
        let targetIndex = getTargetIndexFromClickNumber(taskClickNumber, N_cur)
        drawTask(A_cur, W_cur, N_cur, targetIndex)
        if(taskClickNumber >= N_cur+1){//current clicks count on canvas per task
            taskIdx++;
            isTaskStarted = false;
            taskClickNumber = 0;
        }
    }
}

function generateTaskList(A_list, W_list, N){
    for(let i=0; i<A_list.length; i++){
       for(let j=0; j<W_list.length; j++){
           tasks.push(new Task(A_list[i], W_list[j], N))
       }
    }
}

function isClickCorrect(clickCoordinate,targetCoordinate, distance){
    let error = sqrt(pow(targetCoordinate.x-clickCoordinate.x, 2)+pow(targetCoordinate.y-clickCoordinate.y, 2));
    if(error > distance){

        return false
    }
    else{
        return true
    }
}

function drawTask(A, W, N, index){
    strokeWeight(3);
    for(let i=0; i<N; i++){
        if(i == index){
            fill('green')
        }
        else{
            fill('white')
        }
        let coordinate = getTargetCoordinates(A,N,i);
        circle(coordinate.x, coordinate.y, W/2);
    }
}

function getTargetCoordinates(A, N,index){
    let x = (windowWidth/2)+((A/2)*cos(radians((index*360)/N)));
    let y = (windowHeight/2)+((A/2)*sin(radians((index*360)/N)));
    return new Pos(x, y);
}

function getTargetIndexFromClickNumber(clickNumber, N){
  return (clickNumber*(N-1)/2)%N;
}

function computeClickData(clickPos, clickTime) {
    var A = tasks[taskIdx].A;
    var W = tasks[taskIdx].W;
    var N = tasks[taskIdx].N;
    var sourcePos = getTargetCoordinates(A, N, getTargetIndexFromClickNumber(taskClickNumber - 1, N));
    var targetPos = getTargetCoordinates(A, N, getTargetIndexFromClickNumber(taskClickNumber, N));
    var isIncorrect = isClickCorrect(clickPos, targetPos, W/2) ? 1 : 0;

    var data = [];
    data.push(A);
    data.push(W);
    data.push(N);
    data.push(taskIdx);
    data.push(taskClickNumber);
    data.push(clickTime);
    data.push(sourcePos.x);
    data.push(sourcePos.y);
    data.push(targetPos.x);
    data.push(targetPos.y);
    data.push(clickPos.x);
    data.push(clickPos.y);
    data.push(isIncorrect);

    clickData.push(data);
}

function aggregateClickDataForTask(){
    for(let i=0; i<tasks.length; i++){
        let A = tasks[i].A;
        let W = tasks[i].W;
        let N = tasks[i].N;
        let agrRes = [];
        let clickTimeList = [], errorList = [];
        for(let j = i*N; j<(i+1)*N; j++){
            clickTimeList.push(clickData[j][5]);
            errorList.push(clickData[j][12]);
        }
        mean_click_time = clickTimeList.reduce((total, value)=>total+value)/N;
        mean_error = errorList.reduce((total, value) =>total + value)/N;
        agrRes.push(A);
        agrRes.push(W);
        agrRes.push(N);
        agrRes.push(mean_click_time);
        agrRes.push(mean_error);
        
        aggregateTaskResult.push(agrRes)
    }
}

function displayTaskData() {
    $('#task-canvas').hide()

    let xValues = aggregateTaskResult.map((val)=>log(2*val[0]/val[1])/log(2));

    let yValues = aggregateTaskResult.map((val)=>val[3])

    let data = xValues.map((val, index) => {
        return [val, yValues[index]]
    })

    let regressionData = regression.linear(data).points;

    let regression_dataset = regressionData.map((val) => { return { x: val[0], y: val[1] } })

    let scattered_dataset = data.map((val) => { return { x: val[0], y: val[1] } })


    const myChart = new Chart('regression-chart', {
        data: {
            datasets: [{
                type: 'scatter',
                label: 'Dataset-1',
                data: scattered_dataset,
                backgroundColor: 'rgb(255, 99, 132)'
            },
            {
                type: 'line',
                label: 'Dataset-2',
                data: regression_dataset,
                backgroundColor: 'rgb(0, 255, 255)',
                borderColor : 'rgb(0, 255, 255)'
            }]
        }
    })


    const errorChart = new Chart('error-chart', {
        type: 'bar',
        data: {
            labels: aggregateTaskResult.map((_, index) => "Task-" + (index + 1)),
            datasets: [{
                label: "My Second Dataset",
                data: aggregateTaskResult.map((val) => val[4])
            }]
        }
    })
}