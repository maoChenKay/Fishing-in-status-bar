export interface fish {
    name: string;
    weight: number;
    price: number;
    isFish: boolean;
}

export function randomFish(fishs: fish[]): fish{
    if (fishs.length === 0) {
        throw new Error('物品列表不能为空');
    }
    const totalWeight = fishs.reduce((sum, { weight }) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    for (const fish of fishs) {
        currentWeight += fish.weight;
        if (random < currentWeight) {
            return fish;
        }
    }
    return fishs[0]
}

export function priceMuti(luck: number = 0, fish: fish): number{
    let price = fish.price;
    let flag = true;
    let mutiLine = luck + 0.3;
    if(fish.isFish == false){
        return price
    }
    if(luck >= 1){
        console.log('too much luck')
        return price
    }
    while(flag){
        if(Math.random() < mutiLine){
            price *= 2;
        }
        else{
            flag = false;
        }
    }
    return price;
}

export function goodFish(fish: fish, price: number, time: number){
    if(fish.price > 8){
        return "Wow!";
    }
    if(price > fish.price * 7){
        return "Good fish!";
    }
    if(time < 100){
        return "Perfect!";
    }
    return "";
}