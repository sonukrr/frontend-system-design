import React from 'react'

const ProductCard = ({title, thumbnail, description}) => {
  return (
    <div className="border-2 p-2 m-2 w-[15rem]">
        <div className="font-bold mb-2">{title}</div>
        <div>
            <img src={thumbnail} alt={title}></img>
        </div>
        <div>{description}</div>
    </div>
  )
}

export default ProductCard
