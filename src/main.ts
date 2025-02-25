import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fish from './fish';
import { State } from './state';

let tray: Tray | null = null;

let clickCount = 0;
let currentState = State.Sleep;
let currentIcon = 'fishrod.1';

let dailyLuck = (Math.floor(Math.random() * 200) - 100) / 1000;
let money = 0;
let cateatfish = 0;
let lastFish = 'No info';
let lastPrice = 0;

let gamePath = '/Users/alen/Documents/Files/code/Typescript/status bar fishing'

let fishList: fish.fish[] = [];

let hook: NodeJS.Timeout | null = null;
let comingCat: NodeJS.Timeout | null = null;

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
  const iconPath: string[] = ['fishrod.1', 'fishrod.2', 'warning', 'empty', 'cat', 'rainbow', 'catfish', 'blue discus', 'shrimp', 'glasses', 'clam', 'star', 'demon', 'baba']
  readData()

  tray = new Tray(nativeImage.createFromPath(path.join(gamePath, 'assets/cat.png')))

  function changeIcon(name: string): void{
    const icon = nativeImage.createFromPath(path.join(gamePath, '/assets', name + '.png'));
    if(iconPath.includes(name)){
      if(name == 'cat'){
        tray?.setImage(icon.resize({width: 18, height: 18}));
      }
      else{
        tray?.setImage(icon.resize({width: 18, height: 18}));
      }
      if(name != 'empty'){
        currentIcon = name;
      }
    }
    else{console.log('Failed to change icon:', name)}
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
  function afterShineIcon(): void{
    function goodIcon(): void{
      tray?.setTitle('Perfect!')
    }
    function showIcon(): void{
      tray?.setTitle('')
    }
    setTimeout(goodIcon, 1500)
    setTimeout(showIcon, 3500)
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

  function catComes(): void{
    currentState = State.Sleep;
    cateatfish += lastPrice;
    money -= lastPrice;
    changeIcon('cat');
  }
  

  tray.on('click', async () => {
    clickCount++; 

    switch(currentState){
      case State.Sleep:
        stopFishing();
        break;

      case State.Wait:
        if (comingCat !== null) {
          clearTimeout(comingCat)
        }
        changeIcon('fishrod.2');
        const waitTime = 3 + Math.random() * 12;
        hook = setTimeout(hookedFish, waitTime * 500);
        currentState = State.Fish;
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

        const myFish: fish.fish = fish.randomFish(fishList);
        lastFish = myFish.name
        lastPrice = fish.priceMuti(dailyLuck, myFish);
        money += lastPrice
        changeIcon(myFish.name);
        if(myFish.price > 1){
          shineIcon();
        }
        if(myFish.price > 8){
          afterShineIcon();
        }
        currentState = State.Wait;

        comingCat = setTimeout(catComes, 300 * 1000)

        break;
    }
    
  });

  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
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
        enabled: false,
      },
      {
        label: `Last: ${lastFish} +${lastPrice}`,
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