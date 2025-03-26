import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fish from './fish';
import { State } from './state';

let gamePath = '/Users/alen/Documents/Files/code/Typescript/status bar fishing'

let tray: Tray | null = null;
let contextMenu: Menu | null = null;

let money = 0;
let cateatfish = 0;
let lastFish: fish.fish = {"name": "noinfo", "weight": 0,  "price": 0, "isFish": false};
let lastPrice = 0;

let clickCount = 0;
let currentState = State.Sleep;
let currentIcon = 'fishrod.1';

let fishList: fish.fish[] = [];
function readData(): void{

  fs.readFile(path.join(gamePath ,'fishlist.json'), 'utf8', (error, data) => {
    if(error){
       console.log(error);
       return;
    }
    fishList = JSON.parse(data);
  })
  fs.readFile(path.join(gamePath ,'save.json'), 'utf8', (error, data) => {
    if(error){
       console.log(error);
       return;
    }
    const saveData = JSON.parse(data);
    money = saveData.money
    cateatfish = saveData.cateatfish
  })
}

let fishRodLevel = 0;
let catLevel = 0;
const updateLevel = () => {
  fishRodLevel = Math.max(Math.floor(Math.log2(money)) - 9, 0);
  catLevel = Math.max(Math.floor(Math.log2(money)) - 6, 1);
}

let dailyLuck = (Math.floor(Math.random() * 200) - 100) / 1000;
let luckDate = new Date().getDate();
function updateLuck(): void{
  if(new Date().getDate() != luckDate){
    luckDate = new Date().getDate();
    dailyLuck = (Math.floor(Math.random() * 200) - 100) / 1000;
  }
}

function changeIcon(tray: Tray | null, name: string): void{
  const icon = nativeImage.createFromPath(path.join(gamePath, '/assets', name + '.png'));
  tray?.setImage(icon.resize({width: 18, height: 18}));
  if(name != 'empty'){
    currentIcon = name;
  }
}

function getIfCat(): boolean{
  let ifCat = true;
  if(contextMenu != null){
    const cat = contextMenu.getMenuItemById("cat")
    ifCat = cat != null && cat.checked != undefined? cat.checked : true
  }
  return ifCat
}

const diceToNumber = (name:string) => parseInt(name[5]);
const numberToDice = (n: number) => 'dice.' + n.toString()
function diceAnime(){
  let next = 1
  if(currentIcon.includes('dice')){
    next = (diceToNumber(currentIcon) + Math.floor(Math.random() * 5)) % 6 + 1;
  }
  else{
    next = Math.floor(Math.random() * 6) + 1;
  }
  changeIcon(tray, numberToDice(next))
}
function delaydInterval(callback: () => void, delay: number, interval: number){
  const handle = setInterval(callback, interval);
  setTimeout(() => clearInterval(handle), delay);
  return handle
}
  
const hideIcon = () => changeIcon(tray, 'empty');
const showIcon = () => changeIcon(tray, currentIcon);
const shineIcon = () => {setTimeout(hideIcon, 400); setTimeout(showIcon, 600)};
let title = "";
const hideTitle = () => tray?.setTitle(title);
const showTitle = () => tray?.setTitle('');
const shineTitle = () => {setTimeout(hideTitle, 1500); setTimeout(showTitle, 3500)};

let fishTime = 0;
const escapedFish = () => {currentState = State.Wait; changeIcon(tray, 'fishrod.1')}

let hook: NodeJS.Timeout | null = null;
function hookedFish(): void{
  currentState = State.Catch;
  changeIcon(tray, 'warning');
  fishTime = new Date().getMilliseconds()
  hook = setTimeout(escapedFish, 1000);
}

function startFishing(): void{
  changeIcon(tray, 'fishrod.2');
  const waitTime = 3 + Math.random() * 12;
  hook = setTimeout(hookedFish, waitTime * 500);
  currentState = State.Fish;
}

function priceMuti(time: number): number{
    if(lastFish.isFish == false){
      return Math.floor(lastFish.price);
    }

    const justifiedTime = Math.min(600, Math.max(200, time)) -200;
    let timeMuti = 1.5 - Math.floor(justifiedTime / 8) / 100;
    let price = lastFish.price * timeMuti * (1 + fishRodLevel / 10);

    let mutiLine = dailyLuck + 0.3;
    while(Math.random() < mutiLine && price < 1048576){
      price *= 2;
    }
    return Math.floor(price * 10) / 10;
}

let comingCat: NodeJS.Timeout | null = null;
function catComes(): void{
  currentState = State.Sleep;
  const ifCat = getIfCat()

  if(ifCat){
    if(lastFish.isFish){
      cateatfish += lastPrice;
      money -= lastPrice;        
    }
    changeIcon(tray, 'cat');      
  }
}
function resetSleepTime(time: number): void{
  if (comingCat !== null) {
    clearTimeout(comingCat);
  }
  comingCat = setTimeout(catComes, time * 1000)
}

app.whenReady().then(() => {
  readData()
  tray = new Tray(nativeImage.createFromPath(path.join(gamePath, 'assets/cat.png')))

  tray.on('click', async () => {
    clickCount++; 
    updateLuck();
    updateLevel();
    resetSleepTime(300);

    switch(currentState){
      case State.Sleep:
        if(lastFish.name == 'rainbow'){
          delaydInterval(diceAnime, 1000, 100);
          currentState = State.Wait;
        }
        else{
          startFishing();
        }
        break;

      case State.Wait:
        startFishing();
        break;

      case State.Fish:
        if (hook !== null) {
          clearTimeout(hook);
        }
        escapedFish();
        break;

      case State.Catch:
        if (hook !== null) {
          clearTimeout(hook)
        }
        const time = fish.calculateTime(fishTime, new Date().getMilliseconds())

        lastFish = fish.randomFish(fishList);
        lastPrice = priceMuti(time);
        money += lastPrice
        changeIcon(tray, lastFish.name);
        title = fish.goodFish(lastFish, lastPrice, time)
        if(lastFish.price > 1){
          shineIcon();
        }
        shineTitle()

        currentState = State.Wait;
        break;
    }
    
  });

  tray.on('right-click', () => {
    const ifCat = getIfCat()

    contextMenu = Menu.buildFromTemplate([
      {
        label: `Daily Luck: ${dailyLuck}`,
        enabled: false,
      },
      {
        label: `Money: ${money}`,
        enabled: false,
      },
      {
        label: `: ${cateatfish}`,
        type: 'checkbox',
        id: 'cat',
        checked: ifCat,
      },
      {
        label: `Last: ${lastFish.name} +${lastPrice}`,
        enabled: false,
      },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => exit() },
    ]);
    tray?.popUpContextMenu(contextMenu);
  });


  tray.setToolTip(lastFish.name);
});

function exit(): void{
  const saveData = {'money': money, 'cateatfish': cateatfish}
  fs.writeFile(path.join(gamePath, 'save.json'), JSON.stringify(saveData), (error) => {
    if (error) {
      console.log('An error has occurred ', error);
      return;
    }
    console.log('Data written to save successfully');
    app.quit()
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    exit();
  }
});