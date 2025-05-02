import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fish from './fish';
import { State } from './state';

console.log("builded")

const second = 1000
let gamePath = '/Users/alen/Documents/Files/code/Typescript/status-bar-fishing'

let tray: Tray | null = null;
let contextMenu: Menu | null = null;

let yourMoney = 0;
let catMoney = 0;
let lastFish: fish.fish = {"name": "noinfo", "weight": 0,  "price": 0, "isFish": false};
let lastPrice = 0;
let yourMoneyBefore = 0;
let catMoneyBefore = 0;

let clickCount = 0;
let currentState = State.Wait;
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
    yourMoney = saveData.money
    catMoney = saveData.cateatfish
  })
}

let fishrodLevel = 0;
let catLevel = 0;
const updateLevel = () => {
  fishrodLevel = Math.max(Math.floor(Math.log2(yourMoney)), 0);
  catLevel = Math.max(Math.floor(Math.log2(catMoney)), 0);
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
const showTitle = () => tray?.setTitle(title);
const hideTitle = () => tray?.setTitle('');
const shineTitle = () => {setTimeout(showTitle, 1500); setTimeout(hideTitle, 3500)};


let offlineThread: NodeJS.Timeout | null = null;
let catPower = 0;
const catEatIcon = () => changeIcon(tray, 'workcat');
const catRodIcon = () => changeIcon(tray, 'fishrod.3');
const stopAutoWork = () => {
  changeIcon(tray, 'cat'); 
  currentState = State.Sleep
};
const passiveFishing = () => {
  lastFish = fish.randomFish(fishList);
  lastPrice = priceMuti(350);
  if(lastFish.isFish){
    catMoney += lastPrice
    catPower += 1
  }
  else{
    if(lastFish.price > 15){
      yourMoney += lastPrice;
    }
  }
  changeIcon(tray, lastFish.name);
  if(lastFish.price > 1){
    shineIcon();
  }
  if((catPower <= 0 || currentState != State.CatFishing) && offlineThread){
    setTimeout(stopAutoWork, 20 * second)
    clearInterval(offlineThread);
  }
  else{
    setTimeout(catRodIcon, 20 * second);
  }
}
const startAutoWork = () => {
  currentState = State.CatFishing;
  catPower = catLevel;
  offlineThread = setInterval(autoFishing, 300 * second);
}
function autoFishing(){
  if((catPower <= 0 || currentState != State.CatFishing) && offlineThread){
    stopAutoWork();
    clearInterval(offlineThread);
  }
  else{
    catPower -= 1;
    passiveFishing()
    setTimeout(catEatIcon, 10 * second);
  }
}


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
  hook = setTimeout(hookedFish, waitTime * second);
  currentState = State.Fish;
}

function priceMuti(time: number): number{
    if(lastFish.price > 15){
      return lastFish.price + fishrodLevel;
    }
    if(lastFish.isFish == false){
      return lastFish.price;
    }

    const justifiedTime = Math.min(600, Math.max(200, time)) -200;
    let timeMuti = 1.5 - Math.floor(justifiedTime / 8) / 100;
    let price = lastFish.price * timeMuti;

    let mutiLine = dailyLuck + 0.3;
    while(Math.random() < mutiLine && price < 1048576){
      price *= 2;
    }
    return Math.floor(price * 10) / 10;
}

let comingCat: NodeJS.Timeout | null = null;
function catComes(): void{
  currentState = State.Sleep;
  yourMoneyBefore = yourMoney;
  catMoneyBefore = catMoney;
  updateLevel();
  const ifCat = getIfCat()

  if(ifCat){
    if(lastFish.isFish){
      catMoney += lastPrice;
      yourMoney -= lastPrice;        
    }
    if(catLevel > 0){
      startAutoWork();
    }
  }
}
function resetSleepTime(time: number): void{
  if (comingCat) {
    clearTimeout(comingCat);
  }
  if (offlineThread){
    clearInterval(offlineThread);
  }
  comingCat = setTimeout(catComes, time * second)
}


app.whenReady().then(() => {
  readData()
  tray = new Tray(nativeImage.createFromPath(path.join(gamePath, 'assets/cat.png')))

  tray.on('click', async () => {
    clickCount++; 
    updateLuck();
    updateLevel();
    hideTitle();
    resetSleepTime(60);

    switch(currentState){
      case State.Sleep:
        if(lastFish.name == 'rainbow'){
          delaydInterval(diceAnime, 1000, 100);
          currentState = State.Wait;
        }
        else{
          startFishing()
        }
        break;

      case State.CatFishing:
      case State.Wait:
        startFishing();
        break;

      case State.Fish:
        if (hook) {
          clearTimeout(hook);
        }
        escapedFish();
        break;

      case State.Catch:
        if (hook) {
          clearTimeout(hook)
        }
        const time = fish.calculateTime(fishTime, new Date().getMilliseconds())

        lastFish = fish.randomFish(fishList);
        lastPrice = priceMuti(time);
        yourMoney += lastPrice
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
    const label_catpower = {
      label: `cat power: ${catPower}`,
      enabled: false,
    };
    const label_lastfish = {
      label: `Last: ${lastFish.name} +${lastPrice}`,
      enabled: false,
    };
    const label_dailyluck = {
      label: `Daily Luck: ${dailyLuck}`,
      enabled: false,
    }; 
    const label_money = {
      label: `You | Cat: ${Math.floor(yourMoney)} | ${Math.floor(catMoney)}`,
      type: 'checkbox' as const,
      id: 'cat',
      checked: ifCat,
    };
    const label_offlineprogress = {
      label: `offline: ${Math.floor(yourMoney - yourMoneyBefore)} | ${Math.floor(catMoney - catMoneyBefore)}`,
      enabled: false,
    };
    switch(currentState){
      case State.CatFishing:
        contextMenu = Menu.buildFromTemplate([
          label_money,
          label_catpower,
          label_lastfish,
          { type: 'separator' },
          { label: 'Quit', type: 'normal', click: () => exit() },
        ]);
        break;
      case State.Sleep:
        contextMenu = Menu.buildFromTemplate([
          label_money,
          label_offlineprogress,
          label_lastfish,
          { type: 'separator' },
          { label: 'Quit', type: 'normal', click: () => exit() },
        ]);
        break;
      case State.Catch:
      case State.Fish:
      case State.Wait:
        contextMenu = Menu.buildFromTemplate([
          label_dailyluck,
          label_money,
          label_lastfish,
          { type: 'separator' },
          { label: 'Quit', type: 'normal', click: () => exit() },
        ]);
        break;
    }
    tray?.popUpContextMenu(contextMenu);
  });


  tray.setToolTip(lastFish.name);
});

function exit(): void{
  const saveData = {'money': yourMoney, 'cateatfish': catMoney}
  fs.writeFile(path.join(gamePath, 'save.json'), JSON.stringify(saveData), (error) => {
    if (error) {
      console.log('An error has occurred ', error);
      return;
    }
    console.log('Data written to save successfully');
    app.quit()
  })
}

app.on('window-all-closed', () => {});