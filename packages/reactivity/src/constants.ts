// 使用字面值字符串而不是数字，以便更容易检查
// 该文件为常量操作符，说明该做什么操作或行为

export enum TrackOpTypes {
    GET = 'get',
    HAS = 'has',
    ITERATE = 'iterate',
}

export enum TriggerOpTypes {
    SET = 'set',
    ADD = 'add',
    DELETE = 'delete',
    CLEAR = 'clear',
}