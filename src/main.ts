import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fish from './fish';
import { State } from './state';
import { start } from 'repl';

let tray: Tray | null = null;

let clickCount = 0;
let currentState = State.Sleep;
let currentIcon = 'fishrod.1';

let dailyLuck = (Math.floor(Math.random() * 200) - 100) / 1000;
let luckDate = new Date().getDate()

let title = "";
let money = 0;
let cateatfish = 0;
let lastFish: fish.fish = {"name": "noinfo", "weight": 0,  "price": 0, "isFish": false};
let lastPrice = 0;

let gamePath = '/Users/alen/Documents/Files/code/Typescript/status bar fishing'

let fishList: fish.fish[] = [];

let hook: NodeJS.Timeout | null = null;
let comingCat: NodeJS.Timeout | null = null;

let contextMenu: Menu | null = null;

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

app.whenReady().then(() => {
  readData()
  tray = new Tray(nativeImage.createFromPath(path.join(gamePath, 'assets/cat.png')))

  function changeIcon(name: string): void{
    const icon = nativeImage.createFromPath(path.join(gamePath, '/assets', name + '.png'));
    tray?.setImage(icon.resize({width: 18, height: 18}));
    if(name != 'empty'){
      currentIcon = name;
    }
  }

  function updateLuck(): void{
    if(new Date().getDate() == luckDate){
      luckDate = new Date().getDate();
      dailyLuck = (Math.floor(Math.random() * 200) - 100) / 1000;
    }
  }

  function shineIcon(): void{
    function hideIcon(): void{
      changeIcon('empty')
    }
    function showIcon(): void{
      changeIcon(currentIcon)
    }
    setTimeout(hideIcon, 400)
    setTimeout(showIcon, 600)
    setTimeout(hideIcon, 1000)
    setTimeout(showIcon, 1200)
  }
  function shineTitle(): void{
    function hideTitle(): void{
      tray?.setTitle(title)
    }
    function showTitle(): void{
      tray?.setTitle('')
    }
    setTimeout(hideTitle, 1500)
    setTimeout(showTitle, 3500)
  }

  function stopFishing(): void{
    currentState = State.Wait;
    changeIcon('fishrod.1');
  }

  function hookedFish(): void{
    currentState = State.Catch;
    changeIcon('warning');
    hook = setTimeout(stopFishing, 1000);
  }

  function startFishing(): void{
    if (comingCat !== null) {
      clearTimeout(comingCat)
    }
    changeIcon('fishrod.2');
    const waitTime = 3 + Math.random() * 12;
    hook = setTimeout(hookedFish, waitTime * 500);
    currentState = State.Fish;
  }

  function catComes(): void{
    currentState = State.Sleep;
    let ifCat = true
    if(contextMenu != null){
      const cat = contextMenu.getMenuItemById("cat")
      if(cat != null){
        ifCat = cat.checked
      }
    }

    if(ifCat){
      if(lastFish.isFish){
        cateatfish += lastPrice;
        money -= lastPrice;        
      }
      changeIcon('cat');      
    }
  }
  

  tray.on('click', async () => {
    clickCount++; 
    updateLuck()

    switch(currentState){
      case State.Sleep:
      case State.Wait:
        startFishing();
        break;

      case State.Fish:
        if (hook !== null) {
          clearTimeout(hook)
        }

        stopFishing();
        break;

      case State.Catch:
        if (hook !== null) {
          clearTimeout(hook)
        }

        lastFish = fish.randomFish(fishList);
        lastPrice = fish.priceMuti(dailyLuck, lastFish);
        money += lastPrice
        changeIcon(lastFish.name);
        title = fish.goodFish(lastFish, lastPrice, 300)
        if(lastFish.price > 1){
          shineIcon();
        }
        shineTitle()

        currentState = State.Wait;
        
        comingCat = setTimeout(catComes, 300 * 1000)

        break;
    }
    
  });

  tray.on('right-click', () => {
    let ifCat = true;
    if(contextMenu != null){
      const cat = contextMenu.getMenuItemById("cat")
      if(cat != null){
        ifCat = cat.checked
      }
    }

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
        label: `Cat: ${cateatfish}`,
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


  tray.setToolTip('Tip');
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