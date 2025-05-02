export enum State{
    Sleep,
    Wait,
    Fish,
    Catch,
    CatFishing,
}

export enum Event{
    None,
    Money, //random money
    Whale, //double time window
    Sunny, //more small fish, chance for double fish
    Squid, //more rare fish
    Luck, //extra luck
}

export function numberToEvent(n: number){
    switch(n){
        case 0: return Event.None
        case 1: return Event.Money
        case 2: return Event.Whale
        case 3: return Event.Sunny
        case 4: return Event.Squid
        case 5: return Event.Luck
    }
    return Event.None
}