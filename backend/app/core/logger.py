import logging
import sys

def setup_logger():
    logger = logging.getLogger("erp_backend")
    logger.setLevel(logging.DEBUG)
    
    # Create console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.DEBUG)
    
    # Create formatter and add to handler
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    
    if not logger.handlers:
        logger.addHandler(ch)
        
    return logger

logger = setup_logger()
