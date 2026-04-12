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
    const [openIndex, setOpenIndex] = useState(null);


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
                        open={index == openIndex}
                        setIsOpen={idx => idx == openIndex ? setOpenIndex(null) : setOpenIndex(idx)}
                    />
                )
            }

        </div>
    )
}

export default Accordion;