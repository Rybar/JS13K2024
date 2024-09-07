import Room from './room';
import Altar from './altar';
import Portal from './portal';

export default class Floor {
    constructor(width, height, maxRoomWidth, maxRoomHeight, roomCount) {
        Object.assign(this, {
            width,
            height,
            maxRoomWidth,
            maxRoomHeight,
            roomCount,
            maxSeparationTries: 20000,
            rooms: [],
            featureRooms: [],
            sizeBias: 1,
            biasInfluence: 0.1,
            featureRoomSize: { width: 15, height: 15 },
            maxGenerationTries: 10
        });
        this.generateFloor();

    }

    generateFloor() {
        this.generateRooms();
        this.separateRooms();

        this.featureRooms = this.identifyFeatureRooms(this.featureRoomSize);
        this.placeAltars(this.featureRooms);
        const edges = this.createGraph(this.featureRooms);
        this.mst = this.createMSTWithExtraEdges(edges);
        const connected = this.connectRooms(this.mst);
        this.rooms = this.rooms.filter(room => connected.has(room));

        //sort rooms by size so that smaller rooms are drawn first
        this.rooms.sort((a, b) => (a.width * a.height) - (b.width * b.height));
        //get largest room to place exit portal in
        const largestRoom = this.rooms[this.rooms.length - 1];
        //place exit portal in the center of the largest room
         
        //if there are no rooms, try again, up to 10 times
        let tries = this.maxGenerationTries;
        if(this.featureRooms.length < 5 && tries > 0) {
            this.generateFloor();
            tries--;
        }
        if(tries === 0) {
            console.log('Failed to generate floor');
        }
    }

    generateRooms() {
        for (let i = 0; i < this.roomCount; i++) {
            const width = Math.floor(this.biasedRandom(2, this.maxRoomWidth, this.sizeBias, this.biasInfluence));
            const height = Math.floor(this.biasedRandom(2, this.maxRoomHeight, this.sizeBias, this.biasInfluence));
            const x = Math.floor(this.width / 2) - Math.floor(width / 2) + Math.floor(width * Math.random());
            const y = Math.floor(this.height / 2) - Math.floor(height / 2) + Math.floor(height * Math.random());
            this.rooms.push(new Room(x, y, width, height));
        }
    }

    separateRooms() {
        for (let tries = 0; tries < this.maxSeparationTries; tries++) {
            let moved = false;
            for (let i = 0; i < this.rooms.length; i++) {
                for (let j = i + 1; j < this.rooms.length; j++) {
                    if (this.isOverlapping(this.rooms[i], this.rooms[j])) {
                        this.adjustPosition(this.rooms[i], this.rooms[j]);
                        moved = true;
                    }
                }
            }
            if (!moved) break;
        }
    }

    isOverlapping(roomA, roomB) {
        return !(roomB.x >= roomA.x + roomA.width ||
            roomB.x + roomB.width <= roomA.x ||
            roomB.y >= roomA.y + roomA.height ||
            roomB.y + roomB.height <= roomA.y);
    }

    adjustPosition(roomA, roomB) {
        const dx = (roomA.x + roomA.width / 2) - (roomB.x + roomB.width / 2);
        const dy = (roomA.y + roomA.height / 2) - (roomB.y + roomB.height / 2);
        const randomOffset = Math.random() * 2 - 1;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                roomA.x += randomOffset;
                roomB.x -= randomOffset;
            } else {
                roomB.x += randomOffset;
                roomA.x -= randomOffset;
            }
        } else {
            if (dy > 0) {
                roomA.y += randomOffset;
                roomB.y -= randomOffset;
            } else {
                roomB.y += randomOffset;
                roomA.y -= randomOffset;
            }
        }
    }

    identifyFeatureRooms(size) {
        return this.rooms.filter(room => room.width > size.width && room.height > size.height);
    }

    placeAltars(featureRooms) {
        let portalPlaced = false;
        let sixPlaced = false;
        let sevenPlaced = false;
        featureRooms.forEach(room => {
            const x = room.x + Math.floor(room.width / 2);
            const y = room.y + Math.floor(room.height / 2);
            const numTorches = Math.round(Math.random() * 2) + 3;
            if (!portalPlaced) {
                console.log('portal placed');
                room.portal = new Portal(x, y);
                portalLocation = {x, y};
                console.log(portalLocation);
                portalPlaced = true;
            } else if (!sixPlaced) {
                room.altar = new Altar(x, y, 6);
                sixPlaced = true;
            } else if (!sevenPlaced) {
                room.altar = new Altar(x, y, 7);
                sevenPlaced = true;
            } else {
                room.altar = new Altar(x, y, numTorches)
            };
        });
    }

    createGraph(featureRooms) {
        const edges = [];
        for (let i = 0; i < featureRooms.length; i++) {
            for (let j = i + 1; j < featureRooms.length; j++) {
                const roomA = featureRooms[i];
                const roomB = featureRooms[j];
                const distance = this.calculateDistance(roomA, roomB);
                edges.push({ roomA, roomB, distance });
            }
        }
        return edges;
    }

    calculateDistance(roomA, roomB) {
        const centerAX = roomA.x + roomA.width / 2;
        const centerAY = roomA.y + roomA.height / 2;
        const centerBX = roomB.x + roomB.width / 2;
        const centerBY = roomB.y + roomB.height / 2;
        return Math.sqrt(Math.pow(centerAX - centerBX, 2) + Math.pow(centerAY - centerBY, 2));
    }

    createMST(edges) {
        edges.sort((a, b) => a.distance - b.distance);
        const mst = [];
        const sets = new Map();

        edges.forEach(edge => {
            const rootA = this.find(sets, edge.roomA);
            const rootB = this.find(sets, edge.roomB);

            if (rootA !== rootB) {
                mst.push(edge);
                sets.set(rootB, rootA);
            }
        });

        return mst;
    }

    createMSTWithExtraEdges(edges) {
        // Step 1: Create the MST
        const mst = this.createMST(edges);
    
        // Step 2: Re-incorporate some of the remaining edges to add loops
        const remainingEdges = edges.filter(edge => !mst.includes(edge));
        console.log(remainingEdges.length);
        const extraEdges = Math.floor(remainingEdges.length * 0.05);
        for (let i = 0; i < extraEdges; i++) {
            const randomEdge = remainingEdges[Math.floor(Math.random() * remainingEdges.length)];
            mst.push(randomEdge);
            remainingEdges.splice(remainingEdges.indexOf(randomEdge), 1);
        }
    
        return mst;
    }
    

    find(sets, room) {
        if (!sets.has(room)) {
            sets.set(room, room);
        }
        if (sets.get(room) !== room) {
            sets.set(room, this.find(sets, sets.get(room)));
        }
        return sets.get(room);
    }


    connectRooms(mst) {
        const connectedRooms = new Set();
        mst.forEach(edge => {
            connectedRooms.add(edge.roomA);
            connectedRooms.add(edge.roomB);
            this.createCorridor(edge.roomA, edge.roomB, connectedRooms);
        });
        return connectedRooms
    }

createCorridor(roomA, roomB, connectedRooms) {
    let currentX = roomA.x + Math.floor(roomA.width / 2);
    let currentY = roomA.y + Math.floor(roomA.height / 2);
    const targetX = roomB.x + Math.floor(roomB.width / 2);
    const targetY = roomB.y + Math.floor(roomB.height / 2);

    while (currentX !== targetX || currentY !== targetY) {
        // Determine nextX and nextY randomly within a range towards the target
        const stepX = (targetX > currentX) ? 1 : -1;
        const stepY = (targetY > currentY) ? 1 : -1;

        let nextX = currentX !== targetX ? currentX + stepX + Math.floor(Math.random()*3) : currentX;
        let nextY = currentY !== targetY ? currentY + stepY + Math.floor(Math.random()*3) : currentY;

        // Adjust to ensure we don't overshoot the target
        nextX = Math.min(Math.max(nextX, Math.min(currentX, targetX)), Math.max(currentX, targetX));
        nextY = Math.min(Math.max(nextY, Math.min(currentY, targetY)), Math.max(currentY, targetY));

        // Create a small room at the current step
        let sizeVariationX = Math.floor(Math.random() * 5) + 1;
        let sizeVariationY = Math.floor(Math.random() * 5) + 1;
        let corridorRoom = new Room(
            Math.min(currentX, nextX),
            Math.min(currentY, nextY),
            Math.abs(nextX - currentX) + sizeVariationX,
            Math.abs(nextY - currentY) + sizeVariationY
        );

        this.rooms.push(corridorRoom);
        connectedRooms.add(corridorRoom);

        // Check if this corridor overlaps with any small rooms and keep them
        this.rooms.forEach(room => {
            if (this.isOverlapping(corridorRoom, room)) {
                connectedRooms.add(room);
            }
        });

        // Move to the next step
        currentX = nextX;
        currentY = nextY;
    }
}

    
    // Helper function to check if a room overlaps with any rooms in connectedRooms
    doesOverlap(corridorRoom, connectedRooms) {
        let overlaps = false;
        connectedRooms.forEach(room => {
            if (this.isOverlapping(corridorRoom, room)) {
                overlaps = true;
            }
        });
        return overlaps;
    }
    
    
    

    // Helper function to check if a room intersects the line between two other rooms
    isRoomIntersectingLine(room, roomA, roomB) {
        const x1 = roomA.x + roomA.width / 2;
        const y1 = roomA.y + roomA.height / 2;
        const x2 = roomB.x + roomB.width / 2;
        const y2 = roomB.y + roomB.height / 2;

        const rectX1 = room.x;
        const rectY1 = room.y;
        const rectX2 = room.x + room.width;
        const rectY2 = room.y + room.height;

        // Check if the line intersects with the room's bounding box
        return this.lineIntersectsRect(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY2);
    }

    // Helper function to check line-rectangle intersection
    lineIntersectsRect(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY2) {
        // Check if the line crosses any of the rectangle's sides
        return this.lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY1) ||
            this.lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY1, rectX2, rectY2) ||
            this.lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY2, rectX1, rectY2) ||
            this.lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY2, rectX1, rectY1) ||
            (x1 > rectX1 && x1 < rectX2 && y1 > rectY1 && y1 < rectY2); // Line starts inside the rectangle
    }

    // Helper function to check if two lines intersect
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = (x4 - x3) * (y2 - y1) - (y4 - y3) * (x2 - x1);
        if (denominator === 0) return false; // Lines are parallel

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    // Connect two rooms directly with a corridor, avoiding overlap
    connectTwoRooms(roomA, roomB) {
        const corridorWidth = 2;

        if (roomA.x !== roomB.x) {
            const corridorX = Math.min(roomA.x, roomB.x);
            const corridorLength = Math.abs(roomA.x - roomB.x);
            const corridorY = roomA.y + Math.floor(roomA.height / 2) - 1; // Center corridor vertically
            this.rooms.push(new Room(corridorX, corridorY, corridorLength, corridorWidth));
        }
        if (roomA.y !== roomB.y) {
            const corridorY = Math.min(roomA.y, roomB.y);
            const corridorLength = Math.abs(roomA.y - roomB.y);
            const corridorX = roomB.x + Math.floor(roomB.width / 2) - 1; // Center corridor horizontally
            this.rooms.push(new Room(corridorX, corridorY, corridorWidth, corridorLength));
        }
    }

    biasedRandom(min, max, bias, influence) {
        let rand = Math.random() * (max - min) + min;
        let mix = Math.random() * influence;
        return rand * (1 - mix) + bias * mix;
    }

    draw(r, view) {
        this.rooms.forEach(room => room.draw(r, view));
    }
}
