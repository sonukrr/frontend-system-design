const AccordionItem = ({ title, content, index, open, setIsOpen }) => {

    return (
        <div key={index} style={{ width: '500px', marginBottom: 10, borderRadius: "0.5rem", cursor: "pointer", border: "1px solid grey" }}>
            <div onClick={(() => setIsOpen(index))} style={{ display: 'flex', justifyContent: 'space-between', background: "lightgrey", padding: "1rem 0.5rem", borderRadius: "0.5rem", color: "black" }}>
                <div>{title}</div>
                <div style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} >^</div>
            </div>


            {
                open && (
                    <div style={{ padding: "1rem 0.5rem" }}>
                        {content}
                    </div>
                )
            }
        </div>
    )
}


export default AccordionItem;
