const doGet = (e) => {
  const indexHtml = HtmlService.createTemplateFromFile('index')
  indexHtml.roomId = e.parameter.roomId ? e.parameter.roomId : ''
  indexHtml.url = ScriptApp.getService().getUrl()
  return indexHtml.evaluate()
}

const generateRoomId = () => Math.random().toString(32).substring(2)
const generateUserId = () => Math.random().toString(32).substring(2)
const saveRoomData = (id, data) => PropertiesService.getScriptProperties().setProperty(id, JSON.stringify({
  ...data, 
  lastUpdated: (new Date()).toISOString()
}))

const getRoomData = (id) => {
  const property = PropertiesService.getScriptProperties().getProperty(id)
  return property ? JSON.parse(property) : false
}

const createRoom = () => {
  let roomId
  do {
    roomId = generateRoomId()
  } while (getRoomData(roomId))
  const userId = generateUserId()
  const roomData = {
    selectItems: [],
    isVoting: false,
    users: {[userId]: {selected: false, select: ''}},
  }
  saveRoomData(roomId, roomData)
  return {roomId, userId, roomData: JSON.stringify(roomData)}
}

const joinRoom = (roomId, isGhost) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  let userId
  if (!isGhost) {
    do {
      userId = generateUserId()
    } while (roomData.users[userId])
    roomData.users[userId] = {selected: false, select: ''}
    saveRoomData(roomId, roomData)
  }
  return {userId, roomData: JSON.stringify(roomData)}
}

const exitRoom = (roomId, userId) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  delete roomData.users[userId]
  roomData.isVoting = !!Object.values(roomData.users).filter(user => !user.selected).length
  roomData.isStart = roomData.isVoting || roomData.isStart
  saveRoomData(roomId, roomData)
}

const setName = (roomId, userId, name) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  roomData.users[userId].name = name
  saveRoomData(roomId, roomData)
  return {roomData: JSON.stringify(roomData)}
}

const setSelectItems = (roomId, selectItems) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  roomData.selectItems = selectItems
  Object.keys(roomData.users).forEach(userId => {
    roomData.users[userId] = {...roomData.users[userId], selected: false, select: ''}
  })
  saveRoomData(roomId, roomData)
  return {roomData: JSON.stringify(roomData)}
}

const isVoting = (roomId, isVoting) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  roomData.isVoting = isVoting
  roomData.isStart = roomData.isVoting || roomData.isStart
  Object.keys(roomData.users).forEach(userId => {
    roomData.users[userId] = {...roomData.users[userId], selected: false, select: ''}
  })
  saveRoomData(roomId, roomData)
  return {roomData: JSON.stringify(roomData)}
}

const setSelected = (roomId, userId, value) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  roomData.users[userId].selected = true
  roomData.users[userId].select = value
  roomData.isVoting = !!Object.values(roomData.users).filter(user => !user.selected).length
  roomData.isStart = roomData.isVoting || roomData.isStart
  saveRoomData(roomId, roomData)
  return {roomData: JSON.stringify(roomData)}
}

const polling = (roomId) => {
  const roomData = getRoomData(roomId)
  if (!roomData) return false
  return {roomData: JSON.stringify(roomData)}
}

const deleteProperty = () => {
  const properties = PropertiesService.getScriptProperties().getProperties()
  const checkDate = new Date()
  checkDate.setHours(checkDate.getHours() - 2)
  Object.keys(properties)
    .filter(key => JSON.parse(properties[key]).lastUpdated < checkDate.toISOString())
    .forEach(key => PropertiesService.getScriptProperties().deleteProperty(key))
}

const deleteProperties = () => console.log(PropertiesService.getScriptProperties().deleteAllProperties())
const viewProperties = () => console.log(PropertiesService.getScriptProperties().getProperties())
const viewProperty = (key) => console.log(JSON.parse(PropertiesService.getScriptProperties().getProperty(key)))
