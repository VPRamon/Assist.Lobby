var local_stream;

function createRoom(id){
    console.log("Creating Room p2p_id_"+id)
    room_id =  "p2p_id_"+id;
    let peer = new Peer(room_id);
    peer.on('open', (id)=>{
        console.log("Peer Connected with ID: ", id)
        navigator.getUserMedia({audio: true}, (stream)=>{
            local_stream = stream;
            setLocalStream(local_stream)
        },(err)=>{
            console.log(err)
        })
    })
    peer.on('call',(call)=>{
        call.answer(local_stream);
        call.on('stream',(stream)=>{
            setRemoteStream(stream)
        })
    })
}

function setLocalStream(stream){    
    let audio = document.getElementById("local-audio");
    audio.srcObject = stream;
    audio.muted = true;
    audio.play();
}

function setRemoteStream(stream){
   
    let audio = document.getElementById("remote-audio");
    audio.srcObject = stream;
    audio.play();
}


function joinRoom(id){
    console.log("Joining Room p2p_id_"+id)
    room_id = "p2p_id_"+id;
    let peer = new Peer()
    peer.on('open', (id)=>{
        console.log("Connected with Id: "+id)
        navigator.getUserMedia({audio: true}, (stream)=>{
            local_stream = stream;
            setLocalStream(local_stream)
            let call = peer.call(room_id, stream)
            call.on('stream', (stream)=>{
                setRemoteStream(stream);
            })
        }, (err)=>{
            console.log(err)
        })

    })
}