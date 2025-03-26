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

export function goodFish(fish: fish, price: number, time: number){
    if(fish.price > 8){
        return "Wow!";
    }
    if(price > fish.price * 7){
        return "Good fish!";
    }
    if(time < 300){
        return "Perfect!";
    }
    return "";
}

export function calculateTime(t1: number, t2: number): number{
    if(t1 >= t2){
        return t2 - t1 + 1000;
    }
    else{
        return t2 - t1;
    }
}

export function rollADice(sevenWeight: number, sixWeight: number): number{
    return 7;
}