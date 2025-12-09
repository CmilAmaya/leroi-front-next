//import { Handle } from 'react-flow-renderer';
import { Handle } from '@xyflow/react';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

const CustomNode = ({ data }) => {
    const backgroundColor = data.color || '#fff';
    const isYellow = backgroundColor.toLowerCase() === '#ffca00'; 
    const isGreen = backgroundColor.toLowerCase() === '#96e6b3'; 

    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    //const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    
    const shouldWrap = isMobile && (isYellow || isGreen);

    return (
        <div 
            style={{
                padding: 10,
                border: '1px solid #777',
                borderRadius: 5,
                background: backgroundColor,
                color: '#000',
                maxWidth: shouldWrap ? '120px' : 'auto', 
                textAlign: 'center',
                wordWrap: shouldWrap ? 'break-word' : 'normal',
                overflowWrap: shouldWrap ? 'break-word' : 'normal',
                whiteSpace: shouldWrap ? 'pre-wrap' : 'nowrap', 
            }}
        >
            <Handle type="target" position="left" style={{ background: '#555' }} />
            <div>{data.label}</div>
            <Handle type="source" position="right" style={{ background: '#555' }} />
        </div>
    );
};

CustomNode.propTypes = {
    data: PropTypes.shape({
        label: PropTypes.string.isRequired,
        color: PropTypes.string,
    }).isRequired,
};

export default CustomNode;
