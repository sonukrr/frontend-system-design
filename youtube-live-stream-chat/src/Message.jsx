import React from 'react'

const Message = ({id, name, avatar, message}) => {
  return (
    <div className="flex p-2 items-center">
        <div>
            <img className="p-2 rounded-full" src={avatar} height='60' width='60'/>
        </div>
        <div>
            <p className="text-sm">@{name} {message} </p>            
        </div>
    </div>
  )
}

export default Message
