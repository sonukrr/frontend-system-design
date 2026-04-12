import { useState } from "react";
import AccordionItem from "./AccordionItem";


const DATA = [
    {
        title: "Accordion 1",
        content: "Welcome to Accordion 1"
    },
    {
        title: "Accordion 2",
        content: "Welcome to Accordion 2"
    },
    {
        title: "Accordion 3",
        content: "Welcome to Accordion 3"
    },
    {
        title: "Accordion 4",
        content: "Welcome to Accordion 4"
    }

]

const Accordion = () => {

    const [accordions, setAccordions] = useState(DATA);
    const [openIndex, setOpenIndex] = useState([]);


    return (
        <div style={{ margin: "auto", width: '100%' }}>
            <div style={{ width: '100%' }}>
                <h2>Acccordions</h2>
            </div>
            {
                accordions.map((accordion, index) => 
                    <AccordionItem
                        title={accordion.title}
                        content={accordion.content}
                        index={index}
                        open={openIndex.includes(index)}
                        setIsOpen={idx => openIndex.includes(idx) ? setOpenIndex(openIndex.filter(el => el != idx)) : setOpenIndex([...openIndex, idx])}
                    />
                )
            }

        </div>
    )
}

export default Accordion;